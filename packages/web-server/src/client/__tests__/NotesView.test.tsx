/**
 * @jest-environment jsdom
 */
import "./setup";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";
import NotesView from "../components/NotesView";

// Mock fetch
const mockFetch = jest.fn<typeof fetch>();
global.fetch = mockFetch;

describe("NotesView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      json: async () => ({ success: true, data: [] }),
    });
  });

  it("renders without crashing", async () => {
    render(<NotesView />);
    expect(screen.getByText("Loading notes...")).toBeInTheDocument();

    // Wait for the component to finish loading
    await waitFor(() => {
      expect(screen.queryByText("Loading notes...")).not.toBeInTheDocument();
    });
  });

  it("renders search input", async () => {
    render(<NotesView />);

    // Wait for loading to complete
    await screen.findByPlaceholderText("Search notes...");

    const searchInput = screen.getByPlaceholderText("Search notes...");
    expect(searchInput).toBeInTheDocument();
  });

  it("renders create note button", async () => {
    render(<NotesView />);

    // Wait for loading to complete
    await screen.findByTitle("Create new note");

    const createButton = screen.getByTitle("Create new note");
    expect(createButton).toBeInTheDocument();
    expect(createButton).toHaveTextContent("+");
  });
});
