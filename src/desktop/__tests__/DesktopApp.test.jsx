import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import DesktopApp from '../DesktopApp.jsx';

describe('DesktopApp', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the overview in mock mode', async () => {
    render(<DesktopApp />);
    await screen.findByRole('heading', { name: 'Flight Deck' });
    await screen.findByText('Workspace verbunden');
    expect(screen.getByText('Mock API')).toBeInTheDocument();
    expect(screen.getByText('Operations Overview')).toBeInTheDocument();
  });

  it('loads a demo import draft in browser mode', async () => {
    render(<DesktopApp />);
    await screen.findByRole('heading', { name: 'Flight Deck' });

    fireEvent.click(screen.getByRole('button', { name: /Set Import/i }));
    fireEvent.click(screen.getByRole('button', { name: /Demo Import/i }));

    await waitFor(() => {
      expect(screen.getByDisplayValue('recording_2026_05_01')).toBeInTheDocument();
    });
  });

  it('opens the interactive tutorial and exposes scenario tours', async () => {
    render(<DesktopApp />);
    await screen.findByRole('heading', { name: 'Flight Deck' });

    fireEvent.click(screen.getByRole('button', { name: /Interaktive Tour/i }));

    await waitFor(() => {
      expect(screen.getByText(/Volltour: Alle Betriebsbereiche verstehen/i)).toBeInTheDocument();
      expect(screen.getByText(/Schritt 1: Overview als Startpunkt/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Tutorial schliessen/i }));
    fireEvent.click(screen.getAllByRole('button', { name: /^Tutorial$/i })[0]);

    await waitFor(() => {
      expect(screen.getByText(/Szenario 2: Auswertung der Datenbank nach verschiedenen Kriterien/i)).toBeInTheDocument();
    });
  });
});
