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
];

export function getFormation(criterion) {
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
