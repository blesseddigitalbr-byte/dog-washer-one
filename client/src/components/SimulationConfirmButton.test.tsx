import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SimulationConfirmButton } from "./SimulationConfirmButton";
afterEach(cleanup);
describe("confirmação explícita da pré-agenda", () => {
  it("não inclui avisos por padrão", () => {
    const confirm = vi.fn();
    render(<SimulationConfirmButton items={[{status:"valid"},{status:"warning"}]} confirmed={false} pending={false} onConfirm={confirm}/>);
    fireEvent.click(screen.getByRole("button"));
    expect(confirm).toHaveBeenCalledWith(false);
  });
  it("inclui avisos somente após selecionar a opção", () => {
    const confirm = vi.fn();
    render(<SimulationConfirmButton items={[{status:"warning"}]} confirmed={false} pending={false} onConfirm={confirm}/>);
    fireEvent.click(screen.getByRole("button"));
    expect(confirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button"));
    expect(confirm).toHaveBeenCalledWith(true);
  });
  it.each([{confirmed:true,pending:false},{confirmed:false,pending:true}])("bloqueia repetição enquanto confirmada ou pendente: %j", props => {
    const confirm = vi.fn();
    render(<SimulationConfirmButton items={[{status:"valid"}]} {...props} onConfirm={confirm}/>);
    fireEvent.click(screen.getByRole("button"));
    expect(confirm).not.toHaveBeenCalled();
  });
  it("não confirma datas conflitantes ou ignoradas", () => {
    const confirm = vi.fn();
    render(<SimulationConfirmButton items={[{status:"conflict"},{status:"ignored"}]} confirmed={false} pending={false} onConfirm={confirm}/>);
    fireEvent.click(screen.getByRole("button"));
    expect(confirm).not.toHaveBeenCalled();
  });
});
