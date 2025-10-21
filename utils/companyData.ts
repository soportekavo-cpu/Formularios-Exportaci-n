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

export const getCompanyInfo = (company?: Company): CompanyInfo => {
    if (company && companyData[company]) {
        return companyData[company];
    }
    return companyData.dizano;
}