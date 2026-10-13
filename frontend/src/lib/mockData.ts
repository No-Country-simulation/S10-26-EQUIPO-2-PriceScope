export type PriceVariation = {
  category: string;
  weeklyVariation: number;
  monthlyVariation: number;
};

export const inflationSnapshot: PriceVariation[] = [
  { category: "Alimentos", weeklyVariation: 1.3, monthlyVariation: 5.2 },
  { category: "Bebidas", weeklyVariation: 0.9, monthlyVariation: 4.1 },
  { category: "Limpieza", weeklyVariation: 1.1, monthlyVariation: 4.8 },
  { category: "Higiene", weeklyVariation: 0.7, monthlyVariation: 3.3 },
];
