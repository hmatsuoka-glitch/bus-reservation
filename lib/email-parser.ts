export interface ParsedReservation {
  bookingNumber?: string;
  passengerName?: string;
  busCompany?: string;
  departureDate?: string;
  departureTime?: string;
  arrivalTime?: string;
  departureStop?: string;
  arrivalStop?: string;
  seatNumber?: string;
}

export function parseEmailContent(emailText: string): ParsedReservation {
  const result: ParsedReservation = {};

  // 予約番号
  const bookingPatterns = [
    /予約番号[：:\s]*([A-Z0-9\-]+)/,
    /booking\s*(?:number|no|#)[：:\s]*([A-Z0-9\-]+)/i,
    /confirmation\s*(?:number|no|#)[：:\s]*([A-Z0-9\-]+)/i,
    /整理番号[：:\s]*([A-Z0-9\-]+)/,
    /受付番号[：:\s]*([A-Z0-9\-]+)/,
  ];
  for (const pattern of bookingPatterns) {
    const match = emailText.match(pattern);
    if (match) { result.bookingNumber = match[1].trim(); break; }
  }

  // 乗客名
  const namePatterns = [
    /お名前[：:\s]*([^\n]+)/,
    /氏名[：:\s]*([^\n]+)/,
    /passenger\s*name[：:\s]*([^\n]+)/i,
    /name[：:\s]*([^\n]+)/i,
  ];
  for (const pattern of namePatterns) {
    const match = emailText.match(pattern);
    if (match) { result.passengerName = match[1].trim().replace(/\s*様/, ""); break; }
  }

  // バス会社
  const companyPatterns = [
    /([^\n]+バス)[^\n]*/,
    /運行会社[：:\s]*([^\n]+)/,
    /company[：:\s]*([^\n]+)/i,
  ];
  for (const pattern of companyPatterns) {
    const match = emailText.match(pattern);
    if (match) { result.busCompany = match[1].trim(); break; }
  }

  // 出発日
  const datePatterns = [
    /出発日[：:\s]*(\d{4}[年\/\-]\d{1,2}[月\/\-]\d{1,2}[日]?)/,
    /乗車日[：:\s]*(\d{4}[年\/\-]\d{1,2}[月\/\-]\d{1,2}[日]?)/,
    /departure\s*date[：:\s]*(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/i,
    /(\d{4}年\d{1,2}月\d{1,2}日)/,
    /(\d{4}\/\d{1,2}\/\d{1,2})/,
  ];
  for (const pattern of datePatterns) {
    const match = emailText.match(pattern);
    if (match) {
      let date = match[1].trim();
      date = date.replace(/年/, "-").replace(/月/, "-").replace(/日/, "");
      result.departureDate = date;
      break;
    }
  }

  // 出発時刻
  const depTimePatterns = [
    /出発[：:\s]*(\d{1,2}:\d{2})/,
    /乗車時刻[：:\s]*(\d{1,2}:\d{2})/,
    /departure\s*time[：:\s]*(\d{1,2}:\d{2})/i,
  ];
  for (const pattern of depTimePatterns) {
    const match = emailText.match(pattern);
    if (match) { result.departureTime = match[1].trim(); break; }
  }

  // 到着時刻
  const arrTimePatterns = [
    /到着[：:\s]*(\d{1,2}:\d{2})/,
    /降車時刻[：:\s]*(\d{1,2}:\d{2})/,
    /arrival\s*time[：:\s]*(\d{1,2}:\d{2})/i,
  ];
  for (const pattern of arrTimePatterns) {
    const match = emailText.match(pattern);
    if (match) { result.arrivalTime = match[1].trim(); break; }
  }

  // 出発停留所
  const depStopPatterns = [
    /出発地[：:\s]*([^\n]+)/,
    /乗車停留所[：:\s]*([^\n]+)/,
    /乗車バス停[：:\s]*([^\n]+)/,
    /出発バス停[：:\s]*([^\n]+)/,
    /from[：:\s]*([^\n]+)/i,
    /departure\s*stop[：:\s]*([^\n]+)/i,
  ];
  for (const pattern of depStopPatterns) {
    const match = emailText.match(pattern);
    if (match) { result.departureStop = match[1].trim(); break; }
  }

  // 到着停留所
  const arrStopPatterns = [
    /到着地[：:\s]*([^\n]+)/,
    /降車停留所[：:\s]*([^\n]+)/,
    /降車バス停[：:\s]*([^\n]+)/,
    /目的地[：:\s]*([^\n]+)/,
    /to[：:\s]*([^\n]+)/i,
    /arrival\s*stop[：:\s]*([^\n]+)/i,
  ];
  for (const pattern of arrStopPatterns) {
    const match = emailText.match(pattern);
    if (match) { result.arrivalStop = match[1].trim(); break; }
  }

  // 座席番号
  const seatPatterns = [
    /座席番号[：:\s]*([A-Z]?\d+[A-Z]?)/,
    /座席[：:\s]*([A-Z]?\d+[A-Z]?)/,
    /シート番号[：:\s]*([A-Z]?\d+[A-Z]?)/,
    /seat\s*(?:number|no)?[：:\s]*([A-Z]?\d+[A-Z]?)/i,
  ];
  for (const pattern of seatPatterns) {
    const match = emailText.match(pattern);
    if (match) { result.seatNumber = match[1].trim(); break; }
  }

  return result;
}
