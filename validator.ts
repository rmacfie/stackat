export class ValidatorError extends Error {
}

export type ValidatorMessage =
  string | (() => string);

export function Validator(messagePrefix?: ValidatorMessage, messageSuffix?: ValidatorMessage) {
  const pf = normalize(messagePrefix);
  const sf = normalize(messageSuffix);

  return (condition: boolean, reason?: ValidatorMessage) => {
    if (!condition) {
      const msg = normalize(reason);
      throw new ValidatorError(`${pf()}${msg()}${sf()}`);
    }
  };
}

function normalize(message?: ValidatorMessage): () => string {
  if (message == null) {
    return () => '';
  } else if (typeof message === 'function') {
    return message;
  } else {
    return () => message;
  }
}
