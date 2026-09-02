<script>
  let items = $state([]);
  let newItemName = $state('');
  let newItemQty = $state(1);
  let newItemUnit = $state('un');
  let editingId = $state(null);
  let editName = $state('');
  let editQty = $state(1);
  let editUnit = $state('un');
  let filter = $state('all');

  const units = ['un', 'kg', 'g', 'L', 'mL', 'pct', 'cx', 'pt'];

  $effect(() => {
    const saved = localStorage.getItem('marketListData');
    if (saved) {
      const data = JSON.parse(saved);
      items = (data.items || []).map(i => {
        const { category, ...rest } = i;
        return rest;
      });
    }
  });

  $effect(() => {
    localStorage.setItem('marketListData', JSON.stringify({ items }));
  });

  function addItem() {
    if (!newItemName.trim()) return;
    let id = Date.now();
    while (items.some(i => i.id === id)) {
      id++;
    }
    const item = {
      id,
      name: newItemName.trim(),
      qty: Number(newItemQty) || 1,
      unit: newItemUnit,
      checked: false,
      createdAt: new Date().toISOString()
    };
    items = [...items, item];
    newItemName = '';
    newItemQty = 1;
    newItemUnit = 'un';
  }

  function removeItem(id) {
    items = items.filter(i => i.id !== id);
  }

  function toggleCheck(id) {
    items = items.map(i => i.id === id ? { ...i, checked: !i.checked } : i);
  }

  function startEdit(item) {
    editingId = item.id;
    editName = item.name;
    editQty = item.qty;
    editUnit = item.unit;
  }

  function saveEdit(id) {
    if (!editName.trim()) return;
    items = items.map(i => i.id === id ? { ...i, name: editName.trim(), qty: Number(editQty) || 1, unit: editUnit } : i);
    editingId = null;
  }

  function cancelEdit() {
    editingId = null;
  }

  function clearChecked() {
    items = items.filter(i => !i.checked);
  }

  function clearAll() {
    if (confirm('Tem certeza que deseja limpar toda a lista?')) {
      items = [];
    }
  }

  let filteredItems = $derived(() => {
    if (filter === 'all') return items;
    if (filter === 'checked') return items.filter(i => i.checked);
    return items.filter(i => !i.checked);
  });

  let stats = $derived(() => ({
    total: items.length,
    checked: items.filter(i => i.checked).length,
    pending: items.filter(i => !i.checked).length
  }));

  function handleKeydown(e) {
    if (e.key === 'Enter') addItem();
  }

  function handleEditKeydown(e, id) {
    if (e.key === 'Enter') saveEdit(id);
    if (e.key === 'Escape') cancelEdit();
  }
</script>

<div class="app">
  <header class="header">
    <div class="header-content">
      <h1>🛒 Market List</h1>
      <div class="stats">
        <span class="stat pending">{stats().pending} pendente{stats().pending !== 1 ? 's' : ''}</span>
        <span class="stat checked">{stats().checked} comprado{stats().checked !== 1 ? 's' : ''}</span>
      </div>
    </div>
  </header>

  <main class="main">
    <section class="add-section">
      <div class="input-group">
        <input
          type="text"
          bind:value={newItemName}
          placeholder="Nome do item..."
          class="input-name"
          onkeydown={handleKeydown}
        />
        <input
          type="number"
          bind:value={newItemQty}
          min="1"
          class="input-qty"
          onkeydown={handleKeydown}
        />
        <select bind:value={newItemUnit} class="input-unit">
          {#each units as unit}
            <option value={unit}>{unit}</option>
          {/each}
        </select>
        <button class="btn-add" disabled={!newItemName.trim()} onclick={addItem}>+</button>
      </div>
    </section>

    <nav class="filters">
      <button class="filter-btn" class:active={filter === 'all'} onclick={() => filter = 'all'}>Todos</button>
      <button class="filter-btn" class:active={filter === 'pending'} onclick={() => filter = 'pending'}>Pendentes</button>
      <button class="filter-btn" class:active={filter === 'checked'} onclick={() => filter = 'checked'}>Comprados</button>
    </nav>

    <section class="items-section">
      {#each filteredItems() as item (item.id)}
        <div class="item" class:checked={item.checked}>
          {#if editingId === item.id}
            <div class="edit-form">
              <input
                type="text"
                bind:value={editName}
                class="edit-input"
                onkeydown={(e) => handleEditKeydown(e, item.id)}
              />
              <input
                type="number"
                bind:value={editQty}
                min="1"
                class="edit-qty"
                onkeydown={(e) => handleEditKeydown(e, item.id)}
              />
              <select bind:value={editUnit} class="edit-unit">
                {#each units as unit}
                  <option value={unit}>{unit}</option>
                {/each}
              </select>
              <button class="btn-save" onclick={() => saveEdit(item.id)}>✓</button>
              <button class="btn-cancel" onclick={cancelEdit}>✕</button>
            </div>
          {:else}
            <div class="item-content">
              <button class="check-btn" onclick={() => toggleCheck(item.id)}>
                {item.checked ? '☑' : '☐'}
              </button>
              <span class="item-name" class:line-through={item.checked}>{item.name}</span>
              <span class="item-qty">{item.qty} {item.unit}</span>
            </div>
            <div class="item-actions">
              <button class="btn-edit" onclick={() => startEdit(item)}>✎</button>
              <button class="btn-remove" onclick={() => removeItem(item.id)}>✕</button>
            </div>
          {/if}
        </div>
      {:else}
        <div class="empty-state">
          <div class="empty-icon">🛒</div>
          <p>Lista vazia!</p>
          <p>Adicione itens acima para começar.</p>
        </div>
      {/each}
    </section>

    {#if items.length > 0}
      <div class="actions">
        {#if stats().checked > 0}
          <button class="btn-clear-checked" onclick={clearChecked}>
            Remover Comprados ({stats().checked})
          </button>
        {/if}
        <button class="btn-clear-all" onclick={clearAll}>Limpar Tudo</button>
      </div>
    {/if}
  </main>
</div>
