import { supabase } from "./_core/supabase.js";
import { canManagePackagePayments } from "../shared/packagePaymentAccess.js";
export const packageOperationalColumns = "id,organization_id,unit_id,client_id,pet_id,package_id,code,contracted_baths,contracted_groomings,balance_baths,balance_groomings,price,contract_date,expiry_date,status,notes,created_at,updated_at,frequency,renewal_source_id";
export async function paymentDetails(role:string|null|undefined):Promise<Map<string,any>> {
  if(!canManagePackagePayments(role))return new Map();
  const {data,error}=await supabase.rpc("client_package_payment_details");
  if(error)throw new Error("Não foi possível consultar os pagamentos dos pacotes");
  return new Map((data??[]).map((row:any)=>[row.id,row]));
}
