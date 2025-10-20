// Function to convert number to words

const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function convert_hundreds(n: number): string {
    if (n > 99) {
        return ones[Math.floor(n / 100)] + ' hundred ' + convert_tens(n % 100);
    }
    return convert_tens(n);
}

function convert_tens(n: number): string {
    if (n < 10) return ones[n];
    if (n >= 10 && n < 20) return teens[n - 10];
    return tens[Math.floor(n / 10)] + ' ' + ones[n % 10];
}

function convert(n: number): string {
    if (n === 0) return 'zero';
    if (n < 0) return 'minus ' + convert(Math.abs(n));
    
    let result = '';
    const billion = Math.floor(n / 1000000000);
    const million = Math.floor((n % 1000000000) / 1000000);
    const thousand = Math.floor((n % 1000000) / 1000);
    const remainder = n % 1000;

    if (billion > 0) {
        result += convert_hundreds(billion) + ' billion ';
    }
    if (million > 0) {
        result += convert_hundreds(million) + ' million ';
    }
    if (thousand > 0) {
        result += convert_hundreds(thousand) + ' thousand ';
    }
    if (remainder > 0) {
        result += convert_hundreds(remainder);
    }
    
    return result.trim().replace(/\s+/g, ' ');
}

export function numberToWords(num: number | '' | undefined): string {
    if (num === '' || num === undefined) return '';
    const n = Number(num);
    if (isNaN(n)) return '';

    const integerPart = Math.floor(n);
    const decimalPart = Math.round((n - integerPart) * 100);

    let words = convert(integerPart);
    words = words.charAt(0).toUpperCase() + words.slice(1);
    
    if (decimalPart > 0) {
        words += ` and ${decimalPart}/100`;
    }

    return `${words} Dollars`;
}