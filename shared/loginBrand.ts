// Public presentation only: never use the hostname to grant data access.
export function loginBrand(hostname: string) {
  const lux = ["app.luxdog.com.br", "olivedrab-emu-744435.hostingersite.com"].includes(hostname.toLowerCase());
  return {
    lux,
    name: lux ? "Lux Dog" : "DWO — Dog Washer One",
    logo: lux ? "/brand/lux-dog.png" : "/brand/dwo-horizontal.png",
    favicon: lux ? "/brand/lux-dog-icon.svg" : "/brand/dwo-icon.png",
    background: lux ? "#F3EEFA" : "#07111E",
    primary: lux ? "#7C3AED" : "#113A7A",
    secondary: lux ? "#0891B2" : "#113A7A",
    message: lux ? "Seu salão, seus clientes e sua agenda em um só lugar." : "Gestão, ensino e operação em uma única plataforma.",
  };
}
