// src/components/Dashboard.test.jsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Dashboard from "./Dashboard";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest"; // Extiende las aserciones de Jest para pruebas en el DOM

// Datos simulados para el usuario
const mockUser = {
  nombre: "Test User",
  userId: "123",
  imagenPerfil: "/img/test-profile.png",
};

// Datos simulados para los partidos
const mockGames = [
  {
    _id: "1",
    name: "Partido A",
    date: "2025-06-01",
    time: "20:00",
    location: "Cancha 1",
    arbitro: null, // Sin árbitro asignado
    postulados: [], // Sin postulados
  },
  {
    _id: "2",
    name: "Partido B",
    date: "2025-06-02",
    time: "18:00",
    location: "Cancha 2",
    arbitro: { _id: "456", nombre: "Arbitro Asignado" }, // Árbitro asignado
    postulados: ["123"], // Un postulado
  },
];

// Configuración antes de cada prueba
beforeEach(() => {
  vi.stubGlobal("alert", vi.fn()); // Mockea window.alert para evitar que se ejecute en las pruebas
  vi.stubGlobal("fetch", vi.fn((url) => {
    // Mockea las respuestas de la API
    if (url.endsWith("/api/usuarios/check-session")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUser), // Devuelve los datos del usuario
      });
    }
    if (url.endsWith("/api/games")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockGames), // Devuelve los partidos simulados
      });
    }
    if (url.includes("/apply")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "Postulación exitosa" }), // Respuesta de postulación
      });
    }
    if (url.includes("/cancel-postulation")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "Postulación cancelada" }), // Respuesta de cancelación
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ message: "OK" }), // Respuesta genérica
    });
  }));
});

// Limpia los mocks después de cada prueba
afterEach(() => {
  vi.restoreAllMocks();
});

// Grupo de pruebas para el componente Dashboard
describe("Dashboard", () => {
  // Prueba 1: Renderiza el dashboard con datos del usuario y partidos
  it("renderiza el dashboard con datos del usuario y partidos", async () => {
    render(<Dashboard />); // Renderiza el componente

    // Verifica que los datos del usuario se muestren correctamente
    expect(await screen.findByText("¡Hola! Test User")).toBeInTheDocument();
    expect(screen.getByAltText("Perfil")).toHaveAttribute("src", "/img/test-profile.png");

    // Verifica que los datos de los partidos se muestren correctamente
    expect(await screen.findByText("Partido A")).toBeInTheDocument();
    expect(screen.getByText("Cancha 1")).toBeInTheDocument();
    expect(screen.getByText("01/06/2025")).toBeInTheDocument();
    expect(screen.getByText("8:00 PM")).toBeInTheDocument();
  });

  // Prueba 2: Maneja el clic en el botón "Postularse"
  it("maneja el clic en el botón 'Postularse'", async () => {
    render(<Dashboard />); // Renderiza el componente

    // Encuentra y haz clic en el botón "Postularse"
    const postularseButton = await screen.findByRole("button", { name: /Postularse/i });
    fireEvent.click(postularseButton);

    // Verifica que se abra el modal
    expect(screen.getByText("¿Deseas postularte para este partido?")).toBeInTheDocument();

    // Encuentra y haz clic en el botón "Confirmar"
    const confirmButton = screen.getByText("Confirmar");
    fireEvent.click(confirmButton);

    // Verifica que el modal se cierre
    await waitFor(() => {
      expect(screen.queryByText("¿Deseas postularte para este partido?")).not.toBeInTheDocument();
    });
  });

  // Prueba 3: Maneja el clic en el botón "Cancelar"
  it("maneja el clic en el botón 'Cancelar'", async () => {
    render(<Dashboard />); // Renderiza el componente

    // Encuentra y haz clic en el primer botón "Postularse"
    const postularseButtons = await screen.findAllByRole("button", { name: /Postularse/i });
    fireEvent.click(postularseButtons[0]);

    // Encuentra y haz clic en el botón "Cancelar"
    const cancelButton = await screen.findByRole("button", { name: /Cancelar/i });
    fireEvent.click(cancelButton);

    // Verifica que el modal se cierre
    await waitFor(() => {
      expect(screen.queryByText("¿Estás seguro de que deseas cancelar tu postulación?")).not.toBeInTheDocument();
    });
  });

  // Prueba 4: Maneja el clic en el botón "Cerrar sesión"
  it("maneja el clic en el botón 'Cerrar sesión'", async () => {
    render(<Dashboard />); // Renderiza el componente

    // Encuentra y haz clic en el botón "Cerrar sesión"
    const logoutButtons = await screen.findAllByRole("button", { name: "Cerrar sesión" });
    fireEvent.click(logoutButtons[0]);

    // Verifica que se haga la llamada a la API de cierre de sesión
    // eslint-disable-next-line no-undef
    expect(global.fetch).toHaveBeenCalledWith("/api/usuarios/logout", expect.any(Object));
  });

  // Prueba 5: Muestra un mensaje cuando no hay partidos disponibles
  it("muestra un mensaje cuando no hay partidos disponibles", async () => {
    // Mockea la respuesta de la API para devolver una lista vacía de partidos
    vi.stubGlobal("fetch", vi.fn((url) => {
      if (url.endsWith("/api/games")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "OK" }),
      });
    }));

    render(<Dashboard />); // Renderiza el componente

    // Verifica que se muestre el mensaje de "No hay partidos disponibles."
    expect(await screen.findByText("No hay partidos disponibles.")).toBeInTheDocument();
  });
});
