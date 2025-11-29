

import type { Company } from '../types';

export interface CompanyInfo {
  name: string;
  address1: string;
  address2: string;
  cityState: string;
  phone: string;
  email: string;
  fullAddress: string;
  shipperText: string;
  beneficiary: string;
  signature?: string; // Base64 image
}

export const companyData: Record<Company, CompanyInfo> = {
  dizano: {
    name: 'DIZANO, S.A.',
    address1: '1ra. Av. A 4-33 Granjas La Joya',
    address2: 'Zona 8 San Miguel Petapa',
    cityState: 'Guatemala, Guatemala.',
    phone: '(502) 2319-8700',
    email: 'exportaciones@cafelasregiones.gt',
    fullAddress: '1 Ave. A 4-33 Granjas La Joya Zona 8, San Miguel Petapa Guatemala, Guatemala.',
    shipperText: `DIZANO, S.A.\n1RA. AV. A 4-33 GRANJAS LA JOYA ZONA 8, SAN MIGUEL PETAPA, GUATEMALA, GUATEMALA`,
    beneficiary: 'Dizano, S.A.',
  },
  proben: {
    name: 'PROBEN, S.A.',
    address1: '1ra. Av. A 4-33, Oficina B, Granjas La Joya',
    address2: 'Zona 8, San Miguel Petapa',
    cityState: 'Guatemala, Guatemala.',
    phone: '(502) 2319-8700',
    email: 'exportaciones@cafelasregiones.gt',
    fullAddress: '1ra. Av. A 4-33, Oficina B Granjas La Joya Zona 8, San Miguel Petapa, Guatemala, Guatemala.',
    shipperText: `PROBEN, S.A.\n1ra. Av. A 4-33, Oficina B, Granjas La Joya Zona 8, San Miguel Petapa, Guatemala, Guatemala.`,
    beneficiary: 'Proben, S.A.',
  }
};

// Calculate coffee harvest year based on date.
// Harvest starts Oct 1st.
// If date is Oct-Dec 2024, harvest is 2024-2025.
// If date is Jan-Sep 2025, harvest is 2024-2025.
export const getHarvestYear = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    const year = date.getFullYear();
    const month = date.getMonth(); // 0 = Jan, 9 = Oct.

    if (month >= 9) {
        return `${year}-${year + 1}`;
    } else {
        return `${year - 1}-${year}`;
    }
};

export const getHarvestOptions = (): string[] => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0 = Jan, 9 = Oct.

    // If currently Oct-Dec (9-11), base is currentYear (e.g. 2024 -> 2024-2025)
    // If currently Jan-Sep (0-8), base is currentYear - 1 (e.g. 2025 -> 2024-2025)
    const baseYear = currentMonth >= 9 ? currentYear : currentYear - 1;

    const options = [];
    // Generate 2 previous years, current, and 3 future years
    for (let i = -2; i <= 3; i++) {
        const start = baseYear + i;
        options.push(`${start}-${start + 1}`);
    }
    return options;
};