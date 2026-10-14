import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
const mocks=vi.hoisted(()=>({result:{} as any,mutate:vi.fn()}));
vi.mock("@/lib/trpc",()=>({trpc:{importReview:{list:{useQuery:()=>mocks.result},history:{useQuery:()=>({data:[],isLoading:false})},adjust:{useMutation:()=>({mutate:mocks.mutate,isPending:false})}}}}));
import ImportReview from "./ImportReview";
beforeEach(()=>{vi.clearAllMocks();mocks.result={data:{rows:[],total:0},isLoading:false,refetch:vi.fn()};});
describe("import review screen",()=>{
 it("does not pretend an empty staging is an import",()=>{render(<ImportReview/>);expect(screen.getByText(/Nenhum lote preparado/)).toBeTruthy();expect(screen.queryByText("Registrar ajuste")).toBeNull();});
 it("requires reason and keeps the original visible",()=>{mocks.result.data={total:1,rows:[{id:"row",version:2,source_sheet:"CLIENTES",source_row:5,source_sha256:"a".repeat(64),original_values:{Nome:"Original"},adjustments:{Nome:"Revisado"},issues:["Conferir vínculo"]}]};render(<ImportReview/>);expect(screen.getByRole("cell",{name:"Original"})).toBeTruthy();expect(screen.getByText("Revisado")).toBeTruthy();expect(screen.getByRole("button",{name:"Registrar ajuste"}).hasAttribute("disabled")).toBe(true);fireEvent.change(screen.getByLabelText("Novo valor"),{target:{value:"Corrigido"}});fireEvent.change(screen.getByLabelText("Motivo do ajuste"),{target:{value:"Conferido com cadastro"}});fireEvent.click(screen.getByRole("button",{name:"Registrar ajuste"}));expect(mocks.mutate).toHaveBeenCalledWith({id:"row",version:2,field:"Nome",value:"Corrigido",reason:"Conferido com cadastro"});});
 it("shows an error instead of a false empty success",()=>{mocks.result={error:{message:"Revisão indisponível"},isLoading:false};render(<ImportReview/>);expect(screen.getByRole("alert").textContent).toBe("Revisão indisponível");expect(screen.queryByText(/Nenhum lote preparado/)).toBeNull();});
});
