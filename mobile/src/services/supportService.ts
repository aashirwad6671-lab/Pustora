import { supabase } from './supabaseClient';
import { ApiResponse } from './api.types';

// Structured FAQ schema representing common quick-commerce queries
export interface FAQItem {
  question: string;
  answer: string;
  category: 'delivery' | 'payments' | 'orders' | 'books';
}

const FAQ_DATABASE: FAQItem[] = [
  {
    category: 'delivery',
    question: 'How fast is Pustora quick-commerce delivery?',
    answer: 'We deliver school textbooks, stationery, and toys in 10-30 minutes inside active zones in Lucknow. Orders are dispatched from the nearest Store Hub.',
  },
  {
    category: 'delivery',
    question: 'What are the delivery charges in Lucknow?',
    answer: 'Delivery is ₹0 (Free) for any address within 3km of our Store Hubs (Hazratganj, Gomti Nagar, Aliganj). For areas beyond 3km, a fee of ₹15 per additional km is charged.',
  },
  {
    category: 'payments',
    question: 'What payment methods does Pustora support?',
    answer: 'We support all popular secure payments: UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, and Cash on Delivery (COD).',
  },
  {
    category: 'orders',
    question: 'Can I return books or geometry kits?',
    answer: 'Yes! We have an easy 7-day hassle-free return policy for unused stationery, geometry kits, and books, provided the seals/packaging are intact.',
  },
];

export class SupportService {
  /**
   * Returns a list of categorized Frequently Asked Questions.
   */
  static getFAQs(): FAQItem[] {
    return FAQ_DATABASE;
  }

  /**
   * Dispatches deep links to launch WhatsApp Support.
   * Format: E.164 (e.g. +91XXXXXXXXXX)
   */
  static getWhatsAppURI(phoneNumber: string = '+919999999999', text: string = 'Hello Pustora Support, I need help with my order'): string {
    const encodedText = encodeURIComponent(text);
    return `https://wa.me/${phoneNumber}?text=${encodedText}`;
  }

  /**
   * Creates a new Customer Support Ticket in Supabase.
   */
  static async createSupportTicket(
    userId: string,
    subject: string,
    description: string,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: userId,
          subject: subject,
          description: description,
          priority: priority,
          status: 'open',
        })
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message, status: 400 };
      }

      return { data, error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message || 'Ticket creation failed', status: 500 };
    }
  }

  /**
   * Fetches all support tickets logged by the active user.
   */
  static async getUserTickets(userId: string): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: error.message, status: 400 };
      }

      return { data: data as any[], error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message || 'Tickets query failed', status: 500 };
    }
  }

  /**
   * Fetches the entire conversation timeline logged under a support ticket.
   */
  static async getTicketMessages(ticketId: string): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) {
        return { data: null, error: error.message, status: 400 };
      }

      return { data: data as any[], error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message || 'Chat messages query failed', status: 500 };
    }
  }

  /**
   * Dispatches a new chat message inside the Live Chat thread.
   */
  static async sendChatMessage(
    ticketId: string,
    senderId: string,
    message: string
  ): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketId,
          sender_id: senderId,
          message: message,
        })
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message, status: 400 };
      }

      // Automatically bump ticket status to 'open' when user responds
      await supabase
        .from('support_tickets')
        .update({ status: 'open' })
        .eq('id', ticketId);

      return { data, error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message || 'Chat send failed', status: 500 };
    }
  }
}
