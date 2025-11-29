
import React from 'react';
import type { CompanyInfo } from '../utils/companyData';
import { numberToWords } from '../utils/numberToWords';

interface FobContractPDFProps {
  data: {
      reportNo: string;
      date: string;
      buyerName: string;
      quantityText: string;
      weightText: string;
      description: string;
      price: number;
      shipmentPeriod: string;
      shippingPort: string;
      destinationPort: string;
      buyerSignature?: string; // Base64
  };
  companyInfo: CompanyInfo;
}

const FobContractPDF: React.FC<FobContractPDFProps> = ({ data, companyInfo }) => {
  
  const formatDate = (dateString: string) => {
      if (!dateString) return '';
      const date = new Date(dateString + 'T00:00:00');
      const day = date.getDate();
      const month = date.toLocaleString('en-GB', { month: 'short' }).toLowerCase();
      const year = date.getFullYear().toString().slice(-2);
      return `${day}-${month}-${year}`;
  };

  const formatPrice = (price: number) => {
      return price.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };
  
  const priceInWords = numberToWords(data.price);

  // -- STYLES --
  const containerStyle: React.CSSProperties = { 
      fontFamily: 'Arial, Helvetica, sans-serif', 
      fontSize: '10px', // Uniform base font size
      color: '#000', 
      padding: '20px 30px', 
      lineHeight: '1.3',
      backgroundColor: '#fff',
      maxWidth: '216mm', // Letter width approx
      margin: '0 auto',
      boxSizing: 'border-box'
  };

  const headerStyle: React.CSSProperties = {
      fontSize: '16px',
      fontWeight: 'bold',
      marginBottom: '20px',
      textTransform: 'uppercase'
  };
  
  const rowStyle: React.CSSProperties = {
      display: 'flex',
      marginBottom: '8px',
      alignItems: 'flex-start'
  };

  const labelStyle: React.CSSProperties = { 
      fontWeight: 'bold', 
      width: '100px', 
      flexShrink: 0,
      fontSize: '10px',
      textTransform: 'uppercase'
  };
  
  const contentStyle: React.CSSProperties = { 
      flexGrow: 1,
      fontSize: '10px',
      borderBottom: '1px solid #e5e7eb', // Subtle line
      paddingBottom: '2px'
  };

  const strongStyle: React.CSSProperties = {
      fontWeight: 'bold'
  };

  const clauseStyle: React.CSSProperties = {
      fontSize: '10px',
      textAlign: 'justify',
      marginBottom: '6px',
      lineHeight: '1.25'
  };
  
  const signatureBlockStyle: React.CSSProperties = {
      marginTop: '30px',
      display: 'flex',
      justifyContent: 'space-between',
      pageBreakInside: 'avoid'
  };

  return (
    <div style={containerStyle}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '20px' }}>
          <div style={headerStyle}>F.O.B. CONTRACT</div>
          <div style={{ textAlign: 'right', fontSize: '10px' }}>
              <div><span style={strongStyle}>Informe de Ventas:</span> {data.reportNo}</div>
              <div><span style={strongStyle}>Date:</span> {formatDate(data.date)}</div>
          </div>
      </div>

      {/* Key Details */}
      <div style={rowStyle}>
          <div style={labelStyle}>SELLER:</div>
          <div style={contentStyle}><span style={strongStyle}>{companyInfo.name}</span></div>
      </div>

      <div style={rowStyle}>
          <div style={labelStyle}>BUYER:</div>
          <div style={contentStyle}><span style={strongStyle}>{data.buyerName}</span></div>
      </div>

      <div style={rowStyle}>
          <div style={labelStyle}>QUANTITY:</div>
          <div style={contentStyle}>
              about <span style={strongStyle}>{data.quantityText}</span> Guatemalan, green coffee
              <br/>
              averaging <span style={strongStyle}>{data.weightText}</span> per bag
          </div>
      </div>

      <div style={rowStyle}>
          <div style={labelStyle}>PACKAGING:</div>
          <div style={{...contentStyle, borderBottom: 'none'}}>
             Coffee must be packed in sound bags of uniform size made of sisal, henequen, jute, burlap of similar woven material without inner lining of outer covering of any other material, properly sewn by hand and/or machine.
          </div>
      </div>

      <div style={rowStyle}>
          <div style={labelStyle}>DESCRIPTION:</div>
          <div style={contentStyle}><span style={strongStyle}>{data.description}</span></div>
      </div>

      <div style={rowStyle}>
          <div style={labelStyle}>PRICE:</div>
          <div style={contentStyle}>
             <span style={strongStyle}>{formatPrice(data.price)}</span> {priceInWords}
          </div>
      </div>

      <div style={rowStyle}>
          <div style={labelStyle}>SHIPMENT:</div>
          <div style={contentStyle}>
              During per <span style={strongStyle}>{data.shipmentPeriod}</span>
              <span style={{ marginLeft: '20px' }}>from: <span style={strongStyle}>{data.shippingPort}</span></span>
              <span style={{ marginLeft: '20px' }}>Seaport(s) to: <span style={strongStyle}>{data.destinationPort}</span></span>
          </div>
      </div>

      {/* Clauses - Compact and Justified - FIXED SPELLING */}
      <div style={{ marginTop: '15px', marginBottom: '15px', borderTop: '1px solid #000', paddingTop: '10px' }}>
          <div style={clauseStyle}>
             By power-propelled vessel(s) by direct and/or recognized indirect route. Partial shipment permitted. Date of on board bill of lading to be evidence of time of shipment, but is not conclusive proof.
          </div>

          <div style={rowStyle}>
              <div style={labelStyle}>ADVICE OF SHIPMENT:</div>
              <div style={{...contentStyle, borderBottom: 'none', textAlign: 'justify'}}>
                 Telegraphic advice of shipment with name of vessel in which coffee is on board, together with the quantity description and port of destination, must be transmitted direct or through Seller Agent/Broker, to the buyer as soon as known but not later than on the day arrival of vessel at destination stated in contract. Where sellers and buyers in the contract involved are in the same area, such advice may be given by hand or verbally or by telephone, with written confirmation to be sent the same day.
              </div>
          </div>

          <div style={rowStyle}>
              <div style={labelStyle}>WEIGHTS:</div>
              <div style={{...contentStyle, borderBottom: 'none', textAlign: 'justify'}}>
                  (1) DELIVERED WEIGHTS: Coffee covered by this contract is to be weighed at port of discharge. Any variation from invoice weights to be adjusted at contract price. (2) SHIPPING WEIGHTS: Coffee covered by this contract is sold on shipping weights. Any loss in weight exceeding 1/2 percent at port of discharge is for account of seller at contract price. (3) Coffee is to be weighed at the port of discharge within fifteen (15) calendar days after discharge from the vessel or fifteen (15) calendar days after all U.S.A. Government clearance have been received whichever is later. Weighing expenses, if any, for account of buyer.
              </div>
          </div>

           <div style={rowStyle}>
              <div style={labelStyle}>INSURANCE:</div>
              <div style={{...contentStyle, borderBottom: 'none'}}>All marine and war risk insurance to be covered by the buyer.</div>
          </div>

           <div style={rowStyle}>
              <div style={labelStyle}>MARKING:</div>
              <div style={{...contentStyle, borderBottom: 'none', textAlign: 'justify'}}>
                 Bags to be branded in English with the name of country of origin and otherwise to comply with laws and regulations of U.S. Government in effect at time of shipment, governing marking of import merchandise. Any expense incurred by failure to comply with this regulation to be borne by seller.
              </div>
          </div>

          <div style={rowStyle}>
              <div style={labelStyle}>DUTIES/TAXES:</div>
              <div style={{...contentStyle, borderBottom: 'none', textAlign: 'justify'}}>
                 Any duty or tax whatsoever imposed by the United States Government or any authority in the United States shall be borne by the buyers.
              </div>
          </div>

          <div style={rowStyle}>
              <div style={labelStyle}>RULING:</div>
              <div style={{...contentStyle, borderBottom: 'none', textAlign: 'justify'}}>
                 The "Ruling on Coffee Contract" of the Green Coffee Association of New York City, Inc. in effect on the date this contract is made, are incorporated for all purposes as a part of this agreement, and together herewith constitute the entire contract. No variation or addition hereto shall be valid unless signed by the parties to the contract.
              </div>
          </div>
          
          <div style={{...clauseStyle, marginTop: '10px'}}>
             Sellers guarantees that the terms printed on the reverse hereof, which by reference are made a part hereof are identical with the terms as printed in By-Laws and Rules of the Green Coffee Association of New York City Inc. Heretofore adopted if no pass. No sale terms are stipulated, then Guarantee clause shall not be applicable. Exceptions to this guarantee are.
          </div>
      </div>

      {/* Signatures */}
      <div style={signatureBlockStyle}>
          {/* Seller */}
          <div style={{ width: '45%' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '30px' }}>ACCEPTED SELLER: <span style={{textDecoration: 'underline'}}>{companyInfo.name}</span></div>
              <div style={{ position: 'relative', borderBottom: '1px solid #000', height: '60px' }}>
                  {companyInfo.signature && (
                     <img 
                        src={companyInfo.signature} 
                        alt="Seller Signature" 
                        style={{ position: 'absolute', bottom: '-15px', left: '10px', maxHeight: '120px', width: 'auto' }} 
                     />
                  )}
              </div>
              <div style={{ fontSize: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>By</span>
                  <span>Agent</span>
              </div>
          </div>

          {/* Buyer */}
          <div style={{ width: '45%' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '30px' }}>ACCEPTED BUYER: <span style={{textDecoration: 'underline'}}>{data.buyerName}</span></div>
              <div style={{ position: 'relative', borderBottom: '1px solid #000', height: '60px' }}>
                  {data.buyerSignature && (
                     <img 
                        src={data.buyerSignature} 
                        alt="Buyer Signature" 
                        style={{ position: 'absolute', bottom: '-15px', left: '10px', maxHeight: '120px', width: 'auto' }} 
                     />
                  )}
              </div>
              <div style={{ fontSize: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>By</span>
                  <span>Agent</span>
              </div>
          </div>
      </div>
      
      <div style={{ textAlign: 'center', fontSize: '8px', marginTop: '15px', color: '#666' }}>
         Where this contract is executed by a person acting for another, such person hereby represents that he is fully authorized to commit his principal.
      </div>

    </div>
  );
};

export default FobContractPDF;
