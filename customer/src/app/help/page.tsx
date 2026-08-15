'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, ChevronUp, MessageCircle, Phone, Mail, FileText } from 'lucide-react';

const FAQ_ITEMS = [
  {
    q: 'How long does delivery take?',
    a: 'We deliver within 1-2 days across Lucknow from our active hubs at Hazratganj, Gomti Nagar, and Aliganj. Express same-day delivery is available for select items.',
  },
  {
    q: 'Can I return or exchange a product?',
    a: 'Yes! We accept returns within 10 days of delivery for all products in original condition. Books must be unused and undamaged. Stationery packs must be unopened. Contact us to initiate a return.',
  },
  {
    q: 'How do I track my order?',
    a: 'Go to Your Account → Your Orders to see real-time order status. You\'ll also receive WhatsApp/SMS updates at each step.',
  },
  {
    q: 'Are the NCERT books original?',
    a: 'Absolutely! We only stock original NCERT books purchased directly from authorised distributors. We never sell pirated or photocopied versions.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept UPI (GPay, PhonePe, Paytm), Debit/Credit Cards, Net Banking, and Cash on Delivery (COD). Pustora Wallet balance can also be used.',
  },
  {
    q: 'Can I order for a school book list?',
    a: 'Yes! Contact us on WhatsApp with your school name and class. We\'ll prepare the complete book set for you and deliver it together.',
  },
  {
    q: 'I didn\'t receive my OTP. What should I do?',
    a: 'Check your spam folder. If still not received, click "Resend OTP" on the verification screen. If the issue persists, contact us on WhatsApp.',
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-[13px] font-medium text-gray-900 pr-4">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4">
          <p className="text-[13px] text-gray-600 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setSubject('');
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center pb-20" style={{ fontFamily: 'var(--font-sans, sans-serif)' }}>
      <div className="w-full max-w-lg bg-gray-50 min-h-screen sm:border-x sm:border-gray-200 sm:shadow-sm flex flex-col">

        {/* Header */}
        <div className="flex items-center px-4 py-4 border-b border-gray-100 bg-white sticky top-0 z-10 shadow-sm">
          <button onClick={() => router.back()} className="mr-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-[16px] font-bold text-gray-900">Help & Support</h1>
        </div>

        {/* Quick Contact */}
        <div className="p-4 bg-white border-b border-gray-100">
          <p className="text-[13px] font-bold text-gray-800 mb-3">Contact us directly</p>
          <div className="grid grid-cols-3 gap-2">
            <a
              href="https://wa.me/919999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 p-3 bg-green-50 rounded-xl border border-green-100 hover:bg-green-100 transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-green-600" />
              <span className="text-[11px] font-semibold text-green-800">WhatsApp</span>
            </a>
            <a
              href="tel:+919999999999"
              className="flex flex-col items-center gap-1.5 p-3 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors"
            >
              <Phone className="w-5 h-5 text-blue-600" />
              <span className="text-[11px] font-semibold text-blue-800">Call Us</span>
            </a>
            <a
              href="mailto:support@pustora.in"
              className="flex flex-col items-center gap-1.5 p-3 bg-purple-50 rounded-xl border border-purple-100 hover:bg-purple-100 transition-colors"
            >
              <Mail className="w-5 h-5 text-purple-600" />
              <span className="text-[11px] font-semibold text-purple-800">Email</span>
            </a>
          </div>
          <p className="text-[11px] text-gray-500 mt-3 text-center">Available Mon–Sat, 9 AM – 7 PM IST</p>
        </div>

        {/* FAQ */}
        <div className="px-4 pt-5 pb-2">
          <h3 className="text-[14px] font-bold text-gray-800">Frequently Asked Questions</h3>
        </div>
        <div className="bg-white border-y border-gray-100">
          {FAQ_ITEMS.map((item, i) => (
            <FaqItem key={i} q={item.q} a={item.a} />
          ))}
        </div>

        {/* Contact Form */}
        <div className="p-4 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-gray-600" />
            <h3 className="text-[14px] font-bold text-gray-800">Send us a message</h3>
          </div>

          {sent ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">✅</div>
              <p className="text-[13px] font-bold text-green-800">Message sent!</p>
              <p className="text-[12px] text-green-600 mt-1">We'll respond within 24 hours.</p>
              <button onClick={() => setSent(false)} className="text-[12px] text-green-700 font-semibold mt-3 underline">
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Order not delivered"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="stitch-input w-full text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Message</label>
                <textarea
                  placeholder="Describe your issue in detail..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={4}
                  className="stitch-input w-full text-[13px] resize-none"
                />
              </div>
              <button type="submit" className="stitch-btn w-full justify-center min-h-[44px]">
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
