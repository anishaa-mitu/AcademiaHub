// Adapter Pattern - adapts different contact methods to a uniform interface
interface ContactInterface {
  sendMessage(to: string, message: string): void;
  getContactLink(identifier: string): string;
}

// WhatsApp implementation
class WhatsAppService {
  openChat(phoneNumber: string, text: string): void {
    const encoded = encodeURIComponent(text);
    const clean = phoneNumber.replace(/\D/g, '');
    window.open(`https://wa.me/${clean}?text=${encoded}`, '_blank');
  }

  buildLink(phoneNumber: string): string {
    const clean = phoneNumber.replace(/\D/g, '');
    return `https://wa.me/${clean}`;
  }
}

// Adapter wraps WhatsApp service under generic interface
class WhatsAppAdapter implements ContactInterface {
  private service: WhatsAppService;

  constructor() {
    this.service = new WhatsAppService();
  }

  sendMessage(phoneNumber: string, message: string): void {
    this.service.openChat(phoneNumber, message);
  }

  getContactLink(phoneNumber: string): string {
    return this.service.buildLink(phoneNumber);
  }
}

// Email contact implementation
class EmailAdapter implements ContactInterface {
  sendMessage(email: string, message: string): void {
    window.open(`mailto:${email}?body=${encodeURIComponent(message)}`, '_blank');
  }

  getContactLink(email: string): string {
    return `mailto:${email}`;
  }
}

export const whatsAppAdapter = new WhatsAppAdapter();
export const emailAdapter = new EmailAdapter();
