import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
const mock = vi.hoisted(() => ({ query: {} as any, mutate: vi.fn(), refetch: vi.fn() }));
vi.mock('@/components/AppointmentForm', () => ({ AppointmentForm: () => <div>Appointment form fixture</div> }));
vi.mock('@/lib/trpc', () => ({ trpc: {
  appointments: { list: { useQuery: () => mock.query }, reverseExecution: { useMutation: () => ({ mutate: mock.mutate }) }, setStatus: { useMutation: () => ({ mutate: mock.mutate }) } },
  clients: { list: { useQuery: () => ({ data: [] }) } }, services: { list: { useQuery: () => ({ data: [] }) } },
  useUtils: () => ({ appointments: { list: { invalidate: vi.fn() } }, clientPackages: { list: { invalidate: vi.fn() } }, asaas: { reconciliation: { invalidate: vi.fn() } } }),
} }));
import Appointments from './Appointments';
beforeEach(() => { vi.clearAllMocks(); mock.query = { data: [], isLoading: false, isError: false, refetch: mock.refetch }; });
it('blocks creation and offers retry when the agenda cannot load', () => {
  mock.query.isError = true; render(<Appointments />);
  expect(screen.getByRole('alert').textContent).toContain('Nenhuma disponibilidade foi confirmada');
  expect((screen.getByRole('button', { name: /Novo Agendamento/ }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' })); expect(mock.refetch).toHaveBeenCalledOnce(); expect(mock.mutate).not.toHaveBeenCalled();
});
it('does not present an empty calendar as loaded while waiting for the query', () => {
  mock.query.isLoading = true; render(<Appointments />); expect(screen.getByRole('status').textContent).toContain('Carregando agenda'); expect((screen.getByRole('button', { name: /Novo Agendamento/ }) as HTMLButtonElement).disabled).toBe(true);
});
it('allows the form after a successfully loaded empty agenda', () => {
  render(<Appointments />); const button = screen.getByRole('button', { name: /Novo Agendamento/ }); expect((button as HTMLButtonElement).disabled).toBe(false); fireEvent.click(button); expect(screen.getByText('Appointment form fixture')).toBeTruthy();
});
