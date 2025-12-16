/* 
  Utilitário simples para gerar o payload do Pix (EMV QRCPS MPM).
  Isso gera a string "000201..." que os apps de banco leem.
*/

export class Pix {
  private pixKey: string;
  private merchantName: string;
  private merchantCity: string;
  private amount: string;
  private txid: string;

  constructor(pixKey: string, merchantName: string, merchantCity: string, amount: string, txid: string = '***') {
    this.pixKey = pixKey;
    this.merchantName = this.normalizeString(merchantName, 25);
    this.merchantCity = this.normalizeString(merchantCity, 15);
    this.amount = parseFloat(amount).toFixed(2);
    this.txid = txid;
  }

  private normalizeString(str: string, maxLength: number): string {
    // Remove accents and truncate
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, maxLength);
  }

  private formatField(id: string, value: string): string {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  }

  private getCRC16(payload: string): string {
    payload += '6304';
    let crc = 0xFFFF;
    const poly = 0x1021;

    for (let i = 0; i < payload.length; i++) {
      crc ^= (payload.charCodeAt(i) << 8);
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = (crc << 1) ^ poly;
        } else {
          crc = crc << 1;
        }
      }
    }

    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  }

  public getPayload(): string {
    const payloadKey = this.formatField('00', 'BR.GOV.BCB.PIX') +
                       this.formatField('01', this.pixKey);

    const merchantAccountInfo = this.formatField('26', payloadKey);
    
    const merchantCategory = this.formatField('52', '0000');
    const transactionCurrency = this.formatField('53', '986'); // BRL
    const transactionAmount = this.formatField('54', this.amount);
    const countryCode = this.formatField('58', 'BR');
    const merchantName = this.formatField('59', this.merchantName);
    const merchantCity = this.formatField('60', this.merchantCity);
    
    const additionalDataField = this.formatField('62', this.formatField('05', this.txid));

    const payload = '000201' +
                    merchantAccountInfo +
                    merchantCategory +
                    transactionCurrency +
                    transactionAmount +
                    countryCode +
                    merchantName +
                    merchantCity +
                    additionalDataField;

    return payload + this.formatField('63', this.getCRC16(payload));
  }
}