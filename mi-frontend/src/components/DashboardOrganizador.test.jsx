// Importa React para que el JSX funcione correctamente.
import React from "react";
// Importa funciones de @testing-library/react para realizar pruebas en el DOM:
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
// Importa funciones de Vitest para estructurar y realizar pruebas:
import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
// Importa el componente `DashboardOrganizador` que será el objetivo de las pruebas.
import DashboardOrganizador from "./DashboardOrganizador";

// Datos simulados para los partidos
// Estos datos representan una lista de partidos ficticios que se utilizan en las pruebas para simular la respuesta de la API.
const mockGames = [
  {
    _id: "123", // ID del partido
    name: "Partido de prueba", // Nombre del partido
    date: "2025-06-01T00:00:00.000Z", // Fecha del partido en formato ISO
    time: "18:30", // Hora del partido
    location: "Cancha 1", // Ubicación del partido
    arbitro: null, // No hay árbitro asignado
  },
];

// Datos simulados para estadísticas
// Representan estadísticas ficticias que se utilizan en las pruebas para simular la respuesta de la API.
const mockStats = {
  total: 3, // Total de partidos
  upcoming: 2, // Partidos próximos
  needsReferee: 1, // Partidos que necesitan árbitro
};

// Configuración antes de cada prueba
beforeEach(() => {
  // Mockea la función global `fetch` para simular respuestas de la API.
  vi.stubGlobal("fetch", vi.fn((url) => {
    // Simula la respuesta de la API para estadísticas de partidos.
    if (url.includes("/api/games/stats")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockStats),
      });
    }
    // Simula la respuesta de la API para cargar partidos.
    if (url.endsWith("/api/games")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockGames),
      });
    }
    // Simula la respuesta de la API para postulados.
    if (url.includes("/postulados")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ postulados: [] }),
      });
    }
    // Respuesta genérica para otros endpoints.
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    });
  }));

  // Mockea las funciones globales `alert` y `confirm` para evitar pop-ups durante las pruebas.
  vi.stubGlobal("alert", vi.fn());
  vi.stubGlobal("confirm", vi.fn(() => true)); // Simula que siempre se confirma.
});

// Limpia los mocks después de cada prueba
afterEach(() => {
  vi.restoreAllMocks(); // Restaura las funciones globales originales.
});

// Grupo de pruebas para el componente DashboardOrganizador
describe("DashboardOrganizador", () => {
  // Prueba 1: Verifica que el título principal y el botón "Agregar Partido" se renderizan correctamente.
  it("renderiza el título principal y el botón 'Agregar Partido'", async () => {
    render(<DashboardOrganizador />); // Renderiza el componente.

    // Verifica que el título principal esté presente.
    const titulo = await screen.findByText("GESTIÓN DE PARTIDOS");
    expect(titulo).toBeDefined();

    // Verifica que el botón "Agregar Partido" esté presente.
    const [agregarBtn] = screen.getAllByRole("button", { name: "Agregar Partido" });
    expect(agregarBtn).toBeDefined();
  });

  // Prueba 2: Verifica que se muestra un partido en la tabla cuando existe al menos uno.
  it("muestra un partido en la tabla cuando existe al menos uno", async () => {
    render(<DashboardOrganizador />); // Renderiza el componente.

    // Verifica que el nombre del partido esté presente.
    const partidos = await screen.findAllByText("Partido de prueba");
    expect(partidos.length).toBeGreaterThan(0);

    // Verifica que la ubicación del partido esté presente.
    const ubicaciones = screen.getAllByText("Cancha 1");
    expect(ubicaciones.length).toBeGreaterThan(0);

    // Verifica que la fecha del partido esté presente.
    const fechas = screen.getAllByText("01/06/2025");
    expect(fechas.length).toBeGreaterThan(0);

    // Verifica que la hora del partido esté presente.
    const horas = screen.getAllByText("6:30 PM");
    expect(horas.length).toBeGreaterThan(0);
  });

  // Prueba 3: Verifica que se abre el modal de "Agregar Partido" al hacer clic en el botón correspondiente.
  it("abre el modal de 'Agregar Partido' al hacer clic en el botón correspondiente", async () => {
    render(<DashboardOrganizador />); // Renderiza el componente.

    // Encuentra y haz clic en el botón "Agregar Partido".
    const [agregarBtn] = await screen.findAllByRole("button", { name: "Agregar Partido" });
    fireEvent.click(agregarBtn);

    // Verifica que el modal se abra mostrando el título "Agregar Partido".
    const modalTitle = await screen.findByRole("heading", { name: "Agregar Partido" });
    expect(modalTitle).toBeDefined();

    // Verifica que el campo de entrada para el nombre del partido esté presente.
    const nameInput = screen.getByPlaceholderText("Nombre del partido");
    expect(nameInput).toBeDefined();
  });

  // Prueba 4: Verifica que se cierra el modal de "Agregar Partido" al hacer clic en "Cancelar".
  it("cierra el modal de 'Agregar Partido' al hacer clic en 'Cancelar'", async () => {
    render(<DashboardOrganizador />); // Renderiza el componente.

    // Encuentra y haz clic en el botón "Agregar Partido".
    const [agregarBtn] = await screen.findAllByRole("button", { name: "Agregar Partido" });
    fireEvent.click(agregarBtn);
    await screen.findByRole("heading", { name: "Agregar Partido" });

    // Encuentra y haz clic en el botón "Cancelar".
    const cancelBtn = screen.getByRole("button", { name: "Cancelar" });
    fireEvent.click(cancelBtn);

    // Verifica que el modal se cierre.
    await waitFor(() => {
      const modalHeading = screen.queryByRole("heading", { name: "Agregar Partido" });
      expect(modalHeading).toBeNull();
    });
  });

  // Prueba 5: Verifica que se muestra un mensaje cuando no hay partidos registrados.
  it("muestra el mensaje cuando no hay partidos registrados", async () => {
    // Mockea la respuesta de la API para devolver una lista vacía de partidos.
    vi.stubGlobal("fetch", vi.fn((url) => {
      if (url.includes("/api/games/stats")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockStats),
        });
      }
      if (url.endsWith("/api/games")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]), // Devuelve una lista vacía.
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    }));

    render(<DashboardOrganizador />); // Renderiza el componente.

    // Verifica que se muestre el mensaje "No hay partidos registrados."
    const noGamesMsg = await screen.findByText("No hay partidos registrados.");
    expect(noGamesMsg).toBeDefined();
  });

  // Prueba 6: Verifica que se invoca `fetch` para cerrar sesión al hacer clic en "Cerrar sesión".
  it("invoca fetch logout al hacer clic en 'Cerrar sesión'", async () => {
    render(<DashboardOrganizador />); // Renderiza el componente.

    // Encuentra y haz clic en el botón "Cerrar sesión".
    const [logoutBtn] = await screen.findAllByRole("button", { name: "Cerrar sesión" });
    fireEvent.click(logoutBtn);

    // Verifica que se haya llamado a la API de cierre de sesión.
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/usuarios/logout", expect.any(Object));
    });
  });
});
