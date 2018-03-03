export class ValidationError extends Error {
}

export type Message =
  string | (() => string);

export default function Check(prefix?: Message, suffix?: Message) {
  const pf = normalize(prefix);
  const sf = normalize(suffix);

  return (condition: boolean, message?: Message) => {
    if (!condition) {
      const msg = normalize(message);
      throw new ValidationError(`${pf()}${msg()}${sf()}`);
    }
  };
}

function normalize(message?: Message): () => string {
  if (message == null) {
    return () => '';
  } else if (typeof message === 'function') {
    return message;
  } else {
    return () => message;
  }
}
