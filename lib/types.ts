export type Student = {
  id: string;
  name: string;
  level: string;
  term: string;
  active: boolean;
  phone: string;
  email: string;
};

export type Session = {
  id: string;
  studentName: string;
  date: string;
  time: string;
  topic: string;
  status: "upcoming" | "completed" | "cancelled";
};

export type Payment = {
  id: string;
  studentName: string;
  amount: number;
  date: string;
  status: "paid" | "pending";
};

export type Attachment = {
  id: string;
  name: string;
  kind: "image" | "file";
  url: string;
};

export type Note = {
  id: string;
  studentId: string;
  title: string;
  content: string;
  date: string;
  attachments: Attachment[];
};
