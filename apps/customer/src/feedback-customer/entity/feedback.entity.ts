export class Feedback {
  id: number;
  customer_id: number;
  title: string;
  content: string;
  agency_id: number;
  agency_name: string;
  admin_id?: number;
  admin_reply?: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export class Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  created_at: Date;
  birth_day?: Date;
  gender?: string;
  adress?: string;
  status?: boolean;
}
