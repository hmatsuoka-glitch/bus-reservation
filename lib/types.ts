export interface Reservation {
  id: string;
  userId: string;
  bookingNumber: string;
  passengerName: string;
  busCompany: string;
  departureDate: string;
  departureTime: string;
  arrivalTime?: string | null;
  departureStop: string;
  arrivalStop: string;
  departureLat?: number | null;
  departureLng?: number | null;
  seatNumber?: string | null;
  qrCodeData?: string | null;
  boardingPassUrl?: string | null;
  status: string;
  notes?: string | null;
  rawEmailContent?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
