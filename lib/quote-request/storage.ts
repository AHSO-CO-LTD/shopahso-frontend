const QUOTE_REQUEST_SKIP_KEY = "shopahso.quoteRequest.skipContactUntil";
const ONE_HOUR_MS = 60 * 60 * 1000;

export type StoredQuoteRequestContact = {
  fullName: string;
  email: string;
  phoneNumber: string;
  quantity: number;
  note: string;
};

type StoredQuoteRequestPreference = {
  expiresAt: number;
  contact: StoredQuoteRequestContact;
};

function isValidContact(value: Partial<StoredQuoteRequestContact> | null | undefined): value is StoredQuoteRequestContact {
  return Boolean(
    value &&
      typeof value.fullName === "string" &&
      typeof value.email === "string" &&
      typeof value.phoneNumber === "string" &&
      typeof value.quantity === "number" &&
      Number.isFinite(value.quantity) &&
      typeof value.note === "string",
  );
}

export function getStoredQuoteRequestContact(): StoredQuoteRequestContact | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(QUOTE_REQUEST_SKIP_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Partial<StoredQuoteRequestPreference>;
    if (
      typeof parsedValue.expiresAt !== "number" ||
      parsedValue.expiresAt <= Date.now() ||
      !isValidContact(parsedValue.contact)
    ) {
      window.localStorage.removeItem(QUOTE_REQUEST_SKIP_KEY);
      return null;
    }

    return parsedValue.contact;
  } catch {
    window.localStorage.removeItem(QUOTE_REQUEST_SKIP_KEY);
    return null;
  }
}

export function setStoredQuoteRequestContact(contact: StoredQuoteRequestContact) {
  if (typeof window === "undefined") {
    return;
  }

  const payload: StoredQuoteRequestPreference = {
    contact,
    expiresAt: Date.now() + ONE_HOUR_MS,
  };

  window.localStorage.setItem(QUOTE_REQUEST_SKIP_KEY, JSON.stringify(payload));
}

export function clearStoredQuoteRequestContact() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(QUOTE_REQUEST_SKIP_KEY);
}
