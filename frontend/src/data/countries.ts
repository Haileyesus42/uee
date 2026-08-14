export type Country = { iso: string; name: string; dialCode: string; flag: string };

// Ethiopia first since this is a UEE (Ethiopian exam) prep app; the rest cover
// common regions. Not an exhaustive ISO list — this is a demo picker.
export const COUNTRIES: Country[] = [
  { iso: 'ET', name: 'Ethiopia', dialCode: '+251', flag: '🇪🇹' },
  { iso: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪' },
  { iso: 'SD', name: 'Sudan', dialCode: '+249', flag: '🇸🇩' },
  { iso: 'SO', name: 'Somalia', dialCode: '+252', flag: '🇸🇴' },
  { iso: 'DJ', name: 'Djibouti', dialCode: '+253', flag: '🇩🇯' },
  { iso: 'ER', name: 'Eritrea', dialCode: '+291', flag: '🇪🇷' },
  { iso: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬' },
  { iso: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬' },
  { iso: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭' },
  { iso: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦' },
  { iso: 'TZ', name: 'Tanzania', dialCode: '+255', flag: '🇹🇿' },
  { iso: 'UG', name: 'Uganda', dialCode: '+256', flag: '🇺🇬' },
  { iso: 'RW', name: 'Rwanda', dialCode: '+250', flag: '🇷🇼' },
  { iso: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
  { iso: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
  { iso: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { iso: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { iso: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { iso: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { iso: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { iso: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { iso: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
];

export const DEFAULT_COUNTRY = COUNTRIES[0];
