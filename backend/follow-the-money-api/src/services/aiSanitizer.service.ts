import prisma from "../prisma";

export interface CategorySummary {
  category: string;
  total: number;
  share: number;
}

export interface UserAggregateMetrics {
  currency: string;
  monthlyTotal: number;
  topCategories: CategorySummary[];
  activeSubscriptionsCount: number;
  subscriptionMonthlyTotal: number;
}

/**
 * Computes strictly minimized, numeric aggregate financial metrics scoped to the user.
 * Excludes all free-text fields (descriptions, titles, notes, account names, user profile data).
 */
export async function computeUserAggregateMetrics(userId: number): Promise<UserAggregateMetrics> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totalsMainCurrency: true },
  });

  const currency = user?.totalsMainCurrency || "EUR";

  // Calculate 30-day window for recent monthly spending
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Aggregate expenses grouped by category
  const categoryGroups = await prisma.expense.groupBy({
    by: ["category"],
    where: {
      userId,
      date: { gte: thirtyDaysAgo },
    },
    _sum: {
      amount: true,
    },
    orderBy: {
      _sum: {
        amount: "desc",
      },
    },
  });

  const monthlyTotalRaw = categoryGroups.reduce(
    (acc, curr) => acc + (curr._sum.amount || 0),
    0
  );
  const monthlyTotal = Math.round(monthlyTotalRaw * 100) / 100;

  const topCategories: CategorySummary[] = categoryGroups.slice(0, 5).map((group) => {
    const total = Math.round((group._sum.amount || 0) * 100) / 100;
    const share = monthlyTotal > 0 ? Math.round((total / monthlyTotal) * 1000) / 10 : 0;
    return {
      category: group.category,
      total,
      share,
    };
  });

  // Query active subscriptions count and commitment
  const activeSubscriptions = await prisma.subscription.findMany({
    where: {
      userId,
      status: "ACTIVE",
    },
    select: {
      price: true,
      billingPeriod: true,
    },
  });

  const activeSubscriptionsCount = activeSubscriptions.length;

  let subscriptionMonthlyTotalRaw = 0;
  for (const sub of activeSubscriptions) {
    const period = sub.billingPeriod.toUpperCase();
    if (period === "YEARLY" || period === "ANNUAL") {
      subscriptionMonthlyTotalRaw += sub.price / 12;
    } else if (period === "WEEKLY") {
      subscriptionMonthlyTotalRaw += sub.price * 4.33;
    } else {
      subscriptionMonthlyTotalRaw += sub.price;
    }
  }

  const subscriptionMonthlyTotal = Math.round(subscriptionMonthlyTotalRaw * 100) / 100;

  return {
    currency,
    monthlyTotal,
    topCategories,
    activeSubscriptionsCount,
    subscriptionMonthlyTotal,
  };
}
