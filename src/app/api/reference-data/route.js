// GET /api/reference-data
// Purpose: provide dropdown options for onboarding/signup form
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const INDUSTRIES = [
  { value: 'technology', label: 'Technology' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'retail', label: 'Retail' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance' },
  { value: 'education', label: 'Education' },
  { value: 'construction', label: 'Construction' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'logistics', label: 'Logistics & Supply Chain' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'hospitality', label: 'Hospitality & Tourism' },
  { value: 'telecommunications', label: 'Telecommunications' },
  { value: 'energy', label: 'Energy & Utilities' },
  { value: 'pharmaceuticals', label: 'Pharmaceuticals' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'media', label: 'Media & Entertainment' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'government', label: 'Government & Public Sector' },
  { value: 'nonprofit', label: 'Non-Profit / NGO' },
  { value: 'food_beverage', label: 'Food & Beverage' },
  { value: 'textile', label: 'Textile & Apparel' },
  { value: 'chemical', label: 'Chemicals' },
  { value: 'mining', label: 'Mining & Metals' },
];

const COUNTRIES = [
  { value: 'India', label: 'India' },
  { value: 'United States', label: 'United States' },
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'United Arab Emirates', label: 'United Arab Emirates' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Germany', label: 'Germany' },
  { value: 'France', label: 'France' },
  { value: 'Singapore', label: 'Singapore' },
  { value: 'Saudi Arabia', label: 'Saudi Arabia' },
  { value: 'Qatar', label: 'Qatar' },
  { value: 'South Africa', label: 'South Africa' },
  { value: 'Japan', label: 'Japan' },
  { value: 'China', label: 'China' },
  { value: 'Netherlands', label: 'Netherlands' },
  { value: 'Italy', label: 'Italy' },
  { value: 'Spain', label: 'Spain' },
  { value: 'Brazil', label: 'Brazil' },
  { value: 'Malaysia', label: 'Malaysia' },
  { value: 'New Zealand', label: 'New Zealand' },
];

const STATES_BY_COUNTRY = {
  India: [
    { value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
    { value: 'Arunachal Pradesh', label: 'Arunachal Pradesh' },
    { value: 'Assam', label: 'Assam' },
    { value: 'Bihar', label: 'Bihar' },
    { value: 'Chhattisgarh', label: 'Chhattisgarh' },
    { value: 'Goa', label: 'Goa' },
    { value: 'Gujarat', label: 'Gujarat' },
    { value: 'Haryana', label: 'Haryana' },
    { value: 'Himachal Pradesh', label: 'Himachal Pradesh' },
    { value: 'Jharkhand', label: 'Jharkhand' },
    { value: 'Karnataka', label: 'Karnataka' },
    { value: 'Kerala', label: 'Kerala' },
    { value: 'Madhya Pradesh', label: 'Madhya Pradesh' },
    { value: 'Tamil Nadu', label: 'Tamil Nadu' },
    { value: 'Maharashtra', label: 'Maharashtra' },
    { value: 'Manipur', label: 'Manipur' },
    { value: 'Meghalaya', label: 'Meghalaya' },
    { value: 'Mizoram', label: 'Mizoram' },
    { value: 'Nagaland', label: 'Nagaland' },
    { value: 'Odisha', label: 'Odisha' },
    { value: 'Punjab', label: 'Punjab' },
    { value: 'Rajasthan', label: 'Rajasthan' },
    { value: 'Sikkim', label: 'Sikkim' },
    { value: 'Telangana', label: 'Telangana' },
    { value: 'Tripura', label: 'Tripura' },
    { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
    { value: 'Uttarakhand', label: 'Uttarakhand' },
    { value: 'West Bengal', label: 'West Bengal' },
    { value: 'Delhi', label: 'Delhi' },
  ],
  'United States': [
    { value: 'California', label: 'California' },
    { value: 'Texas', label: 'Texas' },
    { value: 'New York', label: 'New York' },
    { value: 'Florida', label: 'Florida' },
    { value: 'Illinois', label: 'Illinois' },
  ],
  'United Kingdom': [
    { value: 'England', label: 'England' },
    { value: 'Scotland', label: 'Scotland' },
    { value: 'Wales', label: 'Wales' },
    { value: 'Northern Ireland', label: 'Northern Ireland' },
  ],
  'United Arab Emirates': [
    { value: 'Abu Dhabi', label: 'Abu Dhabi' },
    { value: 'Dubai', label: 'Dubai' },
    { value: 'Sharjah', label: 'Sharjah' },
    { value: 'Ajman', label: 'Ajman' },
    { value: 'Ras Al Khaimah', label: 'Ras Al Khaimah' },
  ],
  Canada: [
    { value: 'Ontario', label: 'Ontario' },
    { value: 'Quebec', label: 'Quebec' },
    { value: 'British Columbia', label: 'British Columbia' },
    { value: 'Alberta', label: 'Alberta' },
  ],
  Australia: [
    { value: 'New South Wales', label: 'New South Wales' },
    { value: 'Victoria', label: 'Victoria' },
    { value: 'Queensland', label: 'Queensland' },
    { value: 'Western Australia', label: 'Western Australia' },
  ],
  Germany: [
    { value: 'Bavaria', label: 'Bavaria' },
    { value: 'Berlin', label: 'Berlin' },
    { value: 'Hamburg', label: 'Hamburg' },
    { value: 'Hesse', label: 'Hesse' },
  ],
  France: [
    { value: 'Ile-de-France', label: 'Ile-de-France' },
    { value: 'Provence-Alpes-Cote d Azur', label: 'Provence-Alpes-Cote d Azur' },
    { value: 'Occitanie', label: 'Occitanie' },
    { value: 'Nouvelle-Aquitaine', label: 'Nouvelle-Aquitaine' },
  ],
  Singapore: [
    { value: 'Central Region', label: 'Central Region' },
    { value: 'East Region', label: 'East Region' },
    { value: 'North Region', label: 'North Region' },
    { value: 'West Region', label: 'West Region' },
  ],
  'Saudi Arabia': [
    { value: 'Riyadh', label: 'Riyadh' },
    { value: 'Makkah', label: 'Makkah' },
    { value: 'Eastern Province', label: 'Eastern Province' },
    { value: 'Madinah', label: 'Madinah' },
  ],
  Qatar: [
    { value: 'Doha', label: 'Doha' },
    { value: 'Al Rayyan', label: 'Al Rayyan' },
    { value: 'Umm Salal', label: 'Umm Salal' },
  ],
  'South Africa': [
    { value: 'Gauteng', label: 'Gauteng' },
    { value: 'Western Cape', label: 'Western Cape' },
    { value: 'KwaZulu-Natal', label: 'KwaZulu-Natal' },
    { value: 'Eastern Cape', label: 'Eastern Cape' },
  ],
  Japan: [
    { value: 'Tokyo', label: 'Tokyo' },
    { value: 'Osaka', label: 'Osaka' },
    { value: 'Kanagawa', label: 'Kanagawa' },
    { value: 'Aichi', label: 'Aichi' },
  ],
  China: [
    { value: 'Beijing', label: 'Beijing' },
    { value: 'Shanghai', label: 'Shanghai' },
    { value: 'Guangdong', label: 'Guangdong' },
    { value: 'Zhejiang', label: 'Zhejiang' },
  ],
  Netherlands: [
    { value: 'North Holland', label: 'North Holland' },
    { value: 'South Holland', label: 'South Holland' },
    { value: 'Utrecht', label: 'Utrecht' },
    { value: 'North Brabant', label: 'North Brabant' },
  ],
  Italy: [
    { value: 'Lombardy', label: 'Lombardy' },
    { value: 'Lazio', label: 'Lazio' },
    { value: 'Campania', label: 'Campania' },
    { value: 'Sicily', label: 'Sicily' },
  ],
  Spain: [
    { value: 'Madrid', label: 'Madrid' },
    { value: 'Catalonia', label: 'Catalonia' },
    { value: 'Andalusia', label: 'Andalusia' },
    { value: 'Valencia', label: 'Valencia' },
  ],
  Brazil: [
    { value: 'Sao Paulo', label: 'Sao Paulo' },
    { value: 'Rio de Janeiro', label: 'Rio de Janeiro' },
    { value: 'Bahia', label: 'Bahia' },
    { value: 'Minas Gerais', label: 'Minas Gerais' },
  ],
  Malaysia: [
    { value: 'Kuala Lumpur', label: 'Kuala Lumpur' },
    { value: 'Selangor', label: 'Selangor' },
    { value: 'Penang', label: 'Penang' },
    { value: 'Johor', label: 'Johor' },
  ],
  'New Zealand': [
    { value: 'Auckland', label: 'Auckland' },
    { value: 'Wellington', label: 'Wellington' },
    { value: 'Canterbury', label: 'Canterbury' },
    { value: 'Waikato', label: 'Waikato' },
  ],
};

const LANGUAGES = [
  { value: 'English', label: 'English' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'French', label: 'French' },
  { value: 'German', label: 'German' },
  { value: 'Arabic', label: 'Arabic' },
  { value: 'Chinese (Simplified)', label: 'Chinese (Simplified)' },
  { value: 'Chinese (Traditional)', label: 'Chinese (Traditional)' },
  { value: 'Japanese', label: 'Japanese' },
  { value: 'Portuguese', label: 'Portuguese' },
  { value: 'Russian', label: 'Russian' },
  { value: 'Italian', label: 'Italian' },
  { value: 'Dutch', label: 'Dutch' },
  { value: 'Korean', label: 'Korean' },
  { value: 'Tamil', label: 'Tamil' },
  { value: 'Telugu', label: 'Telugu' },
  { value: 'Bengali', label: 'Bengali' },
  { value: 'Marathi', label: 'Marathi' },
  { value: 'Urdu', label: 'Urdu' },
  { value: 'Turkish', label: 'Turkish' },
];

const TIME_ZONES = [
  {
    value: '(GMT +5:30) India Standard Time (Asia/Kolkata)',
    label: '(GMT +5:30) India Standard Time (Asia/Kolkata)',
  },
  {
    value: '(GMT 0:00) Greenwich Mean Time (Europe/London)',
    label: '(GMT 0:00) Greenwich Mean Time (Europe/London)',
  },
  {
    value: '(GMT -5:00) Eastern Time (America/New_York)',
    label: '(GMT -5:00) Eastern Time (America/New_York)',
  },
  {
    value: '(GMT -8:00) Pacific Time (America/Los_Angeles)',
    label: '(GMT -8:00) Pacific Time (America/Los_Angeles)',
  },
  {
    value: '(GMT +4:00) Gulf Standard Time (Asia/Dubai)',
    label: '(GMT +4:00) Gulf Standard Time (Asia/Dubai)',
  },
  {
    value: '(GMT +1:00) Central European Time (Europe/Berlin)',
    label: '(GMT +1:00) Central European Time (Europe/Berlin)',
  },
  {
    value: '(GMT +8:00) Singapore Time (Asia/Singapore)',
    label: '(GMT +8:00) Singapore Time (Asia/Singapore)',
  },
  {
    value: '(GMT +9:00) Japan Standard Time (Asia/Tokyo)',
    label: '(GMT +9:00) Japan Standard Time (Asia/Tokyo)',
  },
  {
    value: '(GMT +8:00) China Standard Time (Asia/Shanghai)',
    label: '(GMT +8:00) China Standard Time (Asia/Shanghai)',
  },
  {
    value: '(GMT +10:00) Australian Eastern Time (Australia/Sydney)',
    label: '(GMT +10:00) Australian Eastern Time (Australia/Sydney)',
  },
  {
    value: '(GMT -3:00) Brasilia Time (America/Sao_Paulo)',
    label: '(GMT -3:00) Brasilia Time (America/Sao_Paulo)',
  },
  {
    value: '(GMT +12:00) New Zealand Standard Time (Pacific/Auckland)',
    label: '(GMT +12:00) New Zealand Standard Time (Pacific/Auckland)',
  },
  {
    value: '(GMT +3:00) Arabia Standard Time (Asia/Riyadh)',
    label: '(GMT +3:00) Arabia Standard Time (Asia/Riyadh)',
  },
  {
    value: '(GMT +2:00) South Africa Standard Time (Africa/Johannesburg)',
    label: '(GMT +2:00) South Africa Standard Time (Africa/Johannesburg)',
  },
];

const CURRENCIES = [
  { value: 'INR - Indian Rupee', label: 'INR - Indian Rupee' },
  { value: 'USD - US Dollar', label: 'USD - US Dollar' },
  { value: 'GBP - British Pound Sterling', label: 'GBP - British Pound Sterling' },
  { value: 'AED - UAE Dirham', label: 'AED - UAE Dirham' },
  { value: 'CAD - Canadian Dollar', label: 'CAD - Canadian Dollar' },
  { value: 'AUD - Australian Dollar', label: 'AUD - Australian Dollar' },
  { value: 'EUR - Euro', label: 'EUR - Euro' },
  { value: 'SGD - Singapore Dollar', label: 'SGD - Singapore Dollar' },
  { value: 'SAR - Saudi Riyal', label: 'SAR - Saudi Riyal' },
  { value: 'QAR - Qatari Riyal', label: 'QAR - Qatari Riyal' },
  { value: 'ZAR - South African Rand', label: 'ZAR - South African Rand' },
  { value: 'JPY - Japanese Yen', label: 'JPY - Japanese Yen' },
  { value: 'CNY - Chinese Yuan', label: 'CNY - Chinese Yuan' },
  { value: 'BRL - Brazilian Real', label: 'BRL - Brazilian Real' },
  { value: 'MYR - Malaysian Ringgit', label: 'MYR - Malaysian Ringgit' },
  { value: 'NZD - New Zealand Dollar', label: 'NZD - New Zealand Dollar' },
];

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const country = searchParams.get('country') || 'India';
  const states = STATES_BY_COUNTRY[country] || STATES_BY_COUNTRY.India;

  return NextResponse.json(
    {
      industries: INDUSTRIES,
      countries: COUNTRIES,
      states,
      languages: LANGUAGES,
      timeZones: TIME_ZONES,
      currencies: CURRENCIES,
    },
    { status: 200 }
  );
}
