const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

/** Search only the already-authorized client list; codes mirror the cards. */
export function matchesClientSearch(client: { name: string; pets?: { name: string }[] }, query: string, clientIndex: number, precedingPets: number): boolean {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  const values = [client.name, `CLI-${String(clientIndex + 1).padStart(4, "0")}`];
  client.pets?.forEach((pet, index) => values.push(pet.name, `PET-${String(precedingPets + index + 1).padStart(4, "0")}`));
  const searchable = normalize(values.join(" "));
  return terms.every(term => searchable.includes(term));
}
