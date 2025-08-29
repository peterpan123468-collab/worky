export interface SwissRegion {
  id: string;
  name: string;
  category: 'german' | 'french' | 'italian' | 'alpine';
}

export const SWISS_REGIONS: SwissRegion[] = [
  // German-speaking Switzerland (Deutschschweiz)
  { id: 'zurich', name: 'Zurich & surroundings', category: 'german' },
  { id: 'eastern', name: 'Eastern Switzerland (St. Gallen, Thurgau, Schaffhausen, Appenzell)', category: 'german' },
  { id: 'central', name: 'Central Switzerland (Lucerne, Zug, Schwyz, Uri, Nidwalden, Obwalden)', category: 'german' },
  { id: 'northwestern', name: 'Northwestern Switzerland (Basel-Stadt, Basel-Land, Aargau, Solothurn)', category: 'german' },
  { id: 'bern', name: 'Bern & Mittelland', category: 'german' },
  
  // French-speaking Switzerland (Romandie)
  { id: 'geneva', name: 'Geneva', category: 'french' },
  { id: 'vaud', name: 'Vaud (Lausanne & surroundings)', category: 'french' },
  { id: 'neuchatel', name: 'Neuchâtel', category: 'french' },
  { id: 'jura', name: 'Jura', category: 'french' },
  { id: 'fribourg', name: 'Fribourg (French part)', category: 'french' },
  
  // Italian-speaking Switzerland (Ticino)
  { id: 'ticino', name: 'Lugano, Bellinzona, Locarno', category: 'italian' },
  
  // Alpine Region
  { id: 'graubuenden', name: 'Graubünden', category: 'alpine' },
  { id: 'valais', name: 'Valais', category: 'alpine' },
];

export const REGION_CATEGORIES = {
  german: 'German-speaking Switzerland',
  french: 'French-speaking Switzerland', 
  italian: 'Italian-speaking Switzerland',
  alpine: 'Alpine Region'
};