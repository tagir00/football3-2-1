export const criteria = [
  {
    id: 'ageYoungest',
    title: 'En Genç Kadro',
    subtitle: 'En genç oyunculardan 6 kişilik kadro kur.',
    field: 'age',
    unit: 'yaş',
    higherIsBetter: false,
  },
  {
    id: 'ageOldest',
    title: 'En Yaşlı Kadro',
    subtitle: 'En yaşlı oyunculardan 6 kişilik kadro kur.',
    field: 'age',
    unit: 'yaş',
    higherIsBetter: true,
  },
  {
    id: 'heightTallest',
    title: 'En Uzun Kadro',
    subtitle: 'En uzun boylu oyunculardan 6 kişilik kadro kur.',
    field: 'height',
    unit: 'cm',
    higherIsBetter: true,
  },
  {
    id: 'heightShortest',
    title: 'En Kısa Kadro',
    subtitle: 'En kısa boylu oyunculardan 6 kişilik kadro kur.',
    field: 'height',
    unit: 'cm',
    higherIsBetter: false,
  },
  {
    id: 'marketValueHighest',
    title: 'En Pahalı Kadro',
    subtitle: 'Piyasa değeri en yüksek oyunculardan 6 kişilik kadro kur.',
    field: 'marketValue',
    unit: '€',
    higherIsBetter: true,
    format: 'money',
  },
  {
    id: 'marketValueLowest',
    title: 'En Ucuz Kadro',
    subtitle: 'Piyasa değeri en düşük oyunculardan 6 kişilik kadro kur (0 hariç).',
    field: 'marketValue',
    unit: '€',
    higherIsBetter: false,
    format: 'money',
  },
  {
    id: 'intlGoalsMost',
    title: 'Milli Takımda En Çok Gol',
    subtitle: 'Milli takım formasıyla en çok gol atmış oyunculardan kadro kur (kaleci yok).',
    field: 'intlGoals',
    unit: 'gol',
    higherIsBetter: true,
    excludePosition: 'GK',
  },
  {
    id: 'intlAppearancesMost',
    title: 'Milli Takımda En Çok Maç',
    subtitle: 'Milli takım formasıyla en çok maça çıkmış oyunculardan kadro kur.',
    field: 'intlAppearances',
    unit: 'maç',
    higherIsBetter: true,
  },
  {
    id: 'assistsMost',
    title: 'En Çok Asist',
    subtitle: 'Kariyerinde en çok asist yapan oyunculardan kadro kur (kaleci yok).',
    field: 'assists',
    unit: 'asist',
    higherIsBetter: true,
    excludePosition: 'GK',
  },
  {
    id: 'yellowCardsMost',
    title: 'En Çok Sarı Kart',
    subtitle: 'Kariyerinde en çok sarı kart gören oyunculardan 6 kişilik kadro kur.',
    field: 'yellowCards',
    unit: 'sarı',
    higherIsBetter: true,
  },
  {
    id: 'redCardsMost',
    title: 'En Çok Kırmızı Kart',
    subtitle: 'Kariyerinde en çok kırmızı kart gören oyunculardan 6 kişilik kadro kur.',
    field: 'redCards',
    unit: 'kırmızı',
    higherIsBetter: true,
  },
];

export function getFormation(criterion) {
  if (criterion && criterion.excludePosition === 'GK') {
    return [
      { id: 'DEF-1', position: 'DEF', label: 'DEF' },
      { id: 'DEF-2', position: 'DEF', label: 'DEF' },
      { id: 'MID-1', position: 'MID', label: 'ORT' },
      { id: 'MID-2', position: 'MID', label: 'ORT' },
      { id: 'FW-1', position: 'FW', label: 'SNT' },
      { id: 'FW-2', position: 'FW', label: 'SNT' },
    ];
  }
  return [
    { id: 'GK-1', position: 'GK', label: 'KLC' },
    { id: 'DEF-1', position: 'DEF', label: 'DEF' },
    { id: 'DEF-2', position: 'DEF', label: 'DEF' },
    { id: 'MID-1', position: 'MID', label: 'ORT' },
    { id: 'MID-2', position: 'MID', label: 'ORT' },
    { id: 'FW-1', position: 'FW', label: 'SNT' },
  ];
}

export function formatValue(value, criterion) {
  if (criterion.format === 'money') {
    if (value >= 1_000_000) {
      const millions = value / 1_000_000;
      return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M€`;
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(0)}K€`;
    }
    return `${value}€`;
  }

  return `${value} ${criterion.unit}`;
}

export function formatTotal(value, criterion) {
  if (criterion.format === 'money') {
    return formatValue(value, criterion);
  }
  return `${value}`;
}
