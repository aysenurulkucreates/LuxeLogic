const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const formatMoney = (value: number | null | undefined): string =>
  currency.format(value ?? 0);

export const formatDate = (
  value: string | number | null | undefined,
): string =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

export const formatTime = (
  value: string | number | null | undefined,
): string =>
  value
    ? new Date(value).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
