import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte'
import App from './App.svelte'

const STORAGE_KEY = 'marketListData'

function localStorageMock() {
  let store = {}
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = String(value) }),
    removeItem: vi.fn((key) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
    __store: () => store,
  }
}

function seedStorage(itemsArray) {
  localStorage.__store()[STORAGE_KEY] = JSON.stringify({ items: itemsArray })
}

function getStoredItems() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  return JSON.parse(raw).items ?? []
}

async function addItems(names) {
  const input = screen.getByPlaceholderText('Nome do item...')
  for (const name of names) {
    await fireEvent.input(input, { target: { value: name } })
    await fireEvent.click(screen.getByText('+'))
  }
}

describe('Market List App', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock(),
      writable: true,
    })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  describe('rendering', () => {
    it('shows header and empty state when no items exist', () => {
      render(App)
      expect(screen.getByText('🛒 Market List')).toBeInTheDocument()
      expect(screen.getByText('Lista vazia!')).toBeInTheDocument()
      expect(screen.getByText('Adicione itens acima para começar.')).toBeInTheDocument()
    })

    it('shows stats with zero counts when empty', () => {
      render(App)
      expect(screen.getByText(/0 pendente/)).toBeInTheDocument()
      expect(screen.getByText(/0 comprado/)).toBeInTheDocument()
    })

    it('renders filter buttons', () => {
      render(App)
      expect(screen.getByText('Todos')).toBeInTheDocument()
      expect(screen.getByText('Pendentes')).toBeInTheDocument()
      expect(screen.getByText('Comprados')).toBeInTheDocument()
    })

    it('renders the add form fields', () => {
      render(App)
      expect(screen.getByPlaceholderText('Nome do item...')).toBeInTheDocument()
      expect(screen.getByText('+')).toBeInTheDocument()
    })
  })

  describe('add item', () => {
    it('adds an item with default qty and unit', async () => {
      render(App)
      const input = screen.getByPlaceholderText('Nome do item...')
      await fireEvent.input(input, { target: { value: 'Maçã' } })
      await fireEvent.click(screen.getByText('+'))

      expect(screen.getByText('Maçã')).toBeInTheDocument()
      expect(screen.getByText('1 un')).toBeInTheDocument()
      expect(screen.getByText(/1 pendente/)).toBeInTheDocument()
    })

    it('trims whitespace from item name', async () => {
      render(App)
      const input = screen.getByPlaceholderText('Nome do item...')
      await fireEvent.input(input, { target: { value: '  Arroz  ' } })
      await fireEvent.click(screen.getByText('+'))

      expect(screen.getByText('Arroz')).toBeInTheDocument()
    })

    it('does not add empty items', async () => {
      render(App)
      const input = screen.getByPlaceholderText('Nome do item...')
      await fireEvent.input(input, { target: { value: '   ' } })
      await fireEvent.click(screen.getByText('+'))

      expect(screen.getByText('Lista vazia!')).toBeInTheDocument()
      expect(screen.getByText(/0 pendente/)).toBeInTheDocument()
    })

    it('resets the name input after adding', async () => {
      render(App)
      const input = screen.getByPlaceholderText('Nome do item...')
      await fireEvent.input(input, { target: { value: 'Pão' } })
      await fireEvent.click(screen.getByText('+'))

      expect(input.value).toBe('')
    })

    it('adds an item by pressing Enter in the name field', async () => {
      render(App)
      const input = screen.getByPlaceholderText('Nome do item...')
      await fireEvent.input(input, { target: { value: 'Leite' } })
      await fireEvent.keyDown(input, { key: 'Enter' })

      expect(screen.getByText('Leite')).toBeInTheDocument()
    })

    it('persists newly added items to localStorage', async () => {
      render(App)
      const input = screen.getByPlaceholderText('Nome do item...')
      await fireEvent.input(input, { target: { value: 'Ovos' } })
      await fireEvent.click(screen.getByText('+'))

      const stored = getStoredItems()
      expect(stored).toHaveLength(1)
      expect(stored[0].name).toBe('Ovos')
      expect(stored[0].qty).toBe(1)
      expect(stored[0].unit).toBe('un')
      expect(stored[0].checked).toBe(false)
    })
  })

  describe('toggle check', () => {
    it('marks an item as checked after clicking the checkbox', async () => {
      render(App)
      await addItems(['Banana'])

      const checkBtn = screen.getByText('☐')
      await fireEvent.click(checkBtn)

      expect(screen.getByText('☑')).toBeInTheDocument()
      expect(screen.getByText(/1 comprado/)).toBeInTheDocument()
      expect(screen.getByText(/0 pendente/)).toBeInTheDocument()
    })

    it('unchecks an item when clicked again', async () => {
      render(App)
      await addItems(['Banana'])

      await fireEvent.click(screen.getByText('☐'))
      await fireEvent.click(screen.getByText('☑'))

      expect(screen.getByText('☐')).toBeInTheDocument()
      expect(screen.getByText(/0 comprado/)).toBeInTheDocument()
      expect(screen.getByText(/1 pendente/)).toBeInTheDocument()
    })

    it('adds line-through class to checked items', async () => {
      render(App)
      await addItems(['Banana'])
      await fireEvent.click(screen.getByText('☐'))

      const itemName = screen.getByText('Banana')
      expect(itemName).toHaveClass('line-through')
    })
  })

  describe('remove item', () => {
    it('removes an item when clicking the remove button', async () => {
      render(App)
      await addItems(['Queijo'])

      await fireEvent.click(screen.getByText('✕'))

      expect(screen.queryByText('Queijo')).not.toBeInTheDocument()
      expect(screen.getByText('Lista vazia!')).toBeInTheDocument()
      expect(screen.getByText(/0 pendente/)).toBeInTheDocument()
    })

    it('removes only the targeted item', async () => {
      render(App)
      await addItems(['Queijo', 'Presunto'])

      const items = document.querySelectorAll('.item')
      const removeButtons = screen.getAllByText('✕')
      await fireEvent.click(removeButtons[0])

      expect(screen.queryByText('Queijo')).not.toBeInTheDocument()
      expect(screen.getByText('Presunto')).toBeInTheDocument()
      expect(items.length).toBe(2)
    })
  })

  describe('edit item', () => {
    it('enters edit mode when clicking the edit button', async () => {
      render(App)
      await addItems(['Café'])

      await fireEvent.click(screen.getByText('✎'))

      expect(document.querySelector('.edit-input')).toBeInTheDocument()
    })

    it('saves edited name on Enter', async () => {
      render(App)
      await addItems(['Café'])

      await fireEvent.click(screen.getByText('✎'))
      const editInput = document.querySelector('.edit-input')
      await fireEvent.input(editInput, { target: { value: 'Café Torrado' } })
      await fireEvent.keyDown(editInput, { key: 'Enter' })

      expect(screen.getByText('Café Torrado')).toBeInTheDocument()
      expect(screen.queryByText('Café')).not.toBeInTheDocument()
      expect(document.querySelector('.edit-input')).not.toBeInTheDocument()
    })

    it('saves edited quantity on the save button', async () => {
      render(App)
      await addItems(['Café'])

      await fireEvent.click(screen.getByText('✎'))
      const editQty = document.querySelector('.edit-qty')
      await fireEvent.input(editQty, { target: { value: '3' } })
      await fireEvent.click(screen.getByText('✓'))

      expect(screen.getByText('3 un')).toBeInTheDocument()
    })

    it('cancels editing on Escape without saving', async () => {
      render(App)
      await addItems(['Café'])

      await fireEvent.click(screen.getByText('✎'))
      const editInput = document.querySelector('.edit-input')
      await fireEvent.input(editInput, { target: { value: 'Novo Nome' } })
      await fireEvent.keyDown(editInput, { key: 'Escape' })

      expect(document.querySelector('.edit-input')).not.toBeInTheDocument()
      expect(screen.getByText('Café')).toBeInTheDocument()
      expect(screen.queryByText('Novo Nome')).not.toBeInTheDocument()
    })

    it('cancels editing via the cancel button', async () => {
      render(App)
      await addItems(['Café'])

      await fireEvent.click(screen.getByText('✎'))
      await fireEvent.click(screen.getByText('✕'))

      expect(document.querySelector('.edit-input')).not.toBeInTheDocument()
    })
  })

  describe('filter', () => {
    async function setupFilteredItems() {
      const { container } = render(App)
      const input = container.querySelector('.input-name')
      for (const name of ['Item A', 'Item B', 'Item C']) {
        await fireEvent.input(input, { target: { value: name } })
        await fireEvent.click(container.querySelector('.btn-add'))
      }
      const firstCheck = container.querySelector('.item .check-btn')
      await fireEvent.click(firstCheck)
    }

    it('shows all items by default', async () => {
      await setupFilteredItems()

      expect(screen.getByText('Item A')).toBeInTheDocument()
      expect(screen.getByText('Item B')).toBeInTheDocument()
      expect(screen.getByText('Item C')).toBeInTheDocument()
    })

    it('filters to only checked items', async () => {
      await setupFilteredItems()
      await fireEvent.click(screen.getByText('Comprados'))

      expect(screen.getByText('Item A')).toBeInTheDocument()
      expect(screen.queryByText('Item B')).not.toBeInTheDocument()
      expect(screen.queryByText('Item C')).not.toBeInTheDocument()
    })

    it('filters to only pending items', async () => {
      await setupFilteredItems()
      await fireEvent.click(screen.getByText('Pendentes'))

      expect(screen.queryByText('Item A')).not.toBeInTheDocument()
      expect(screen.getByText('Item B')).toBeInTheDocument()
      expect(screen.getByText('Item C')).toBeInTheDocument()
    })

    it('returns to showing all when Todos is active', async () => {
      await setupFilteredItems()
      await fireEvent.click(screen.getByText('Comprados'))
      await fireEvent.click(screen.getByText('Todos'))

      expect(screen.getByText('Item A')).toBeInTheDocument()
      expect(screen.getByText('Item B')).toBeInTheDocument()
      expect(screen.getByText('Item C')).toBeInTheDocument()
    })
  })

  describe('clear actions', () => {
    it('removes only checked items when clearing checked', async () => {
      render(App)
      await addItems(['Item A', 'Item B'])
      await fireEvent.click(screen.getAllByText('☐')[0])

      await fireEvent.click(screen.getByText(/Remover Comprados/))

      expect(screen.queryByText('Item A')).not.toBeInTheDocument()
      expect(screen.getByText('Item B')).toBeInTheDocument()
    })

    it('clears the whole list when clear all is confirmed', async () => {
      render(App)
      await addItems(['Item A', 'Item B'])

      await fireEvent.click(screen.getByText('Limpar Tudo'))

      expect(screen.getByText('Lista vazia!')).toBeInTheDocument()
      expect(screen.getAllByText(/0 pendente/)).toBeTruthy()
    })

    it('does not clear the list when confirm is cancelled', async () => {
      window.confirm.mockReturnValue(false)
      render(App)
      await addItems(['Item A'])

      await fireEvent.click(screen.getByText('Limpar Tudo'))

      expect(screen.getByText('Item A')).toBeInTheDocument()
    })
  })

  describe('stats', () => {
    it('updates counts correctly with mixed checked state', async () => {
      render(App)
      await addItems(['Item A', 'Item B', 'Item C'])
      await fireEvent.click(screen.getAllByText('☐')[0])

      expect(screen.getByText(/2 pendentes/)).toBeInTheDocument()
      expect(screen.getByText(/1 comprado/)).toBeInTheDocument()
    })

    it('uses singular wording for a single item', async () => {
      render(App)
      await addItems(['Item A'])

      expect(screen.getByText(/1 pendente/)).toBeInTheDocument()
    })
  })

  describe('localStorage persistence', () => {
    it('loads items from localStorage on mount', () => {
      seedStorage([
        { id: 1, name: 'Preloaded', qty: 2, unit: 'kg', checked: false, createdAt: '' },
      ])
      render(App)

      expect(screen.getByText('Preloaded')).toBeInTheDocument()
      expect(screen.getByText('2 kg')).toBeInTheDocument()
    })

    it('strips legacy category field when loading', () => {
      seedStorage([
        { id: 1, name: 'Antigo', qty: 1, unit: 'un', checked: false, category: 'Padaria' },
      ])
      render(App)

      const stored = getStoredItems()
      expect(stored[0].category).toBeUndefined()
    })

    it('persists check state changes', async () => {
      render(App)
      await addItems(['Leite'])
      await fireEvent.click(screen.getByText('☐'))

      const stored = getStoredItems()
      expect(stored[0].checked).toBe(true)
    })

    it('persists edits to localStorage', async () => {
      render(App)
      await addItems(['Café'])

      await fireEvent.click(screen.getByText('✎'))
      const editInput = document.querySelector('.edit-input')
      await fireEvent.input(editInput, { target: { value: 'Capuccino' } })
      await fireEvent.keyDown(editInput, { key: 'Enter' })

      const stored = getStoredItems()
      expect(stored[0].name).toBe('Capuccino')
    })
  })
})
