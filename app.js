"use strict";

/* =========================
   Tarefas • WebApp
   Persistência: LocalStorage
   ========================= */

const STORAGE_KEY = "tarefas_v1";

/* ---------- Estado ---------- */
let tarefas = [];
let filtroTexto = "";
let filtroCategoria = "Todas";
let filtroStatus = "Todas";
let ordenacao = "data_asc";

/* ---------- Helpers DOM ---------- */
const $ = (sel) => document.querySelector(sel);

const form = $("#form-tarefa");
const inputTitulo = $("#titulo");
const inputDescricao = $("#descricao");
const inputPrioridade = $("#prioridade");
const inputDataLimite = $("#data-limite");
const inputCategoria = $("#categoria");

const btnLimpar = $("#btn-limpar");
const btnApagarTudo = $("#btn-apagar-tudo");

const listaContainer = $("#lista-container");
const inputBuscar = $("#buscar");
const selectFiltroCategoria = $("#filtro-categoria");
const selectFiltroStatus = $("#filtro-status");
const selectOrdenar = $("#ordenar");

const msgBox = $("#msg");

/* Dialog edição */
const dlgEditar = $("#dlg-editar");
const formEditar = $("#form-editar");
const editTitulo = $("#edit-titulo");
const editDescricao = $("#edit-descricao");
const editPrioridade = $("#edit-prioridade");
const editDataLimite = $("#edit-data-limite");
const editCategoria = $("#edit-categoria");
const editStatus = $("#edit-status");
const btnCancelarEdicao = $("#btn-cancelar-edicao");

let idxEditando = null;

/* ---------- Utilitários ---------- */
function setMsg(texto, tipo = "info") {
    msgBox.textContent = texto || "";
    msgBox.style.color =
        tipo === "erro" ? "#ff9aa2" :
            tipo === "sucesso" ? "#9ae6b4" :
                "rgba(255,255,255,.7)";
    if (texto) setTimeout(() => (msgBox.textContent = ""), 3000);
}

function hojeISO() {
    return new Date().toISOString().slice(0, 10);
}

function diffDias(dataISO) {
    if (!dataISO) return null;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const validade = new Date(dataISO + "T00:00:00");
    const MS_DIA = 24 * 60 * 60 * 1000;
    return Math.ceil((validade - hoje) / MS_DIA);
}

function getPrioridadeIcon(prioridade) {
    return prioridade === "Alta" ? "🔴" : prioridade === "Média" ? "🟡" : "🟢";
}

function getPrioridadeClass(prioridade) {
    return prioridade === "Alta" ? "alta" : prioridade === "Média" ? "media" : "baixa";
}

function getStatusClass(status) {
    return status === "Pendente" ? "pendente" :
           status === "Em Progresso" ? "em_progresso" : "concluida";
}

/* ---------- Persistência ---------- */
function carregar() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

function salvar() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tarefas));
}

/* ---------- Regras ---------- */
function validarTarefa(titulo, prioridade, dataLimite, categoria) {
    if (!titulo || !titulo.trim()) throw new Error("Título é obrigatório.");
    if (!dataLimite) throw new Error("Data limite é obrigatória.");
    if (!["Alta", "Média", "Baixa"].includes(prioridade)) {
        throw new Error("Prioridade inválida.");
    }
    if (!categoria) throw new Error("Categoria é obrigatória.");
}

function adicionarTarefa(tarefa) {
    validarTarefa(tarefa.titulo, tarefa.prioridade, tarefa.dataLimite, tarefa.categoria);
    tarefas.push({
        id: Date.now(),
        ...tarefa,
        status: "Pendente", // Status inicial
        descricao: tarefa.descricao || ""
    });
    salvar();
}

function removerTarefaPorIndice(idx) {
    if (idx < 0 || idx >= tarefas.length) return;
    tarefas.splice(idx, 1);
    salvar();
}

function atualizarTarefaPorIndice(idx, novaTarefa) {
    if (idx < 0 || idx >= tarefas.length) return;
    validarTarefa(novaTarefa.titulo, novaTarefa.prioridade, novaTarefa.dataLimite, novaTarefa.categoria);
    tarefas[idx] = { ...tarefas[idx], ...novaTarefa };
    salvar();
}

function toggleStatusTarefa(idx) {
    if (idx < 0 || idx >= tarefas.length) return;
    const tarefa = tarefas[idx];
    const status = tarefa.status;
    
    if (status === "Pendente") {
        tarefa.status = "Em Progresso";
    } else if (status === "Em Progresso") {
        tarefa.status = "Concluída";
    } else {
        tarefa.status = "Pendente";
    }
    
    salvar();
}

/* ---------- Renderização ---------- */
function criarBadge(classe, texto) {
    const span = document.createElement("span");
    span.className = `badge ${classe}`;
    span.textContent = texto;
    return span;
}

function criarPrioridadeBadge(prioridade) {
    const classe = getPrioridadeClass(prioridade);
    const icone = getPrioridadeIcon(prioridade);
    return criarBadge(classe, `${icone} ${prioridade}`);
}

function criarStatusBadge(status) {
    const classe = getStatusClass(status);
    return criarBadge(classe, status);
}

function aplicarFiltrosOrdenacao(lista) {
    let out = [...lista];

    // Filtro de texto
    if (filtroTexto.trim()) {
        const t = filtroTexto.trim().toLowerCase();
        out = out.filter((tarefa) => 
            tarefa.titulo.toLowerCase().includes(t) || 
            tarefa.descricao.toLowerCase().includes(t)
        );
    }

    // Filtro de categoria
    if (filtroCategoria !== "Todas") {
        out = out.filter((t) => t.categoria === filtroCategoria);
    }

    // Filtro de status
    if (filtroStatus !== "Todas") {
        out = out.filter((t) => t.status === filtroStatus);
    }

    // Ordenação
    const cmpStr = (a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" });

    // Mapeamento de prioridade para ordenação numérica
    const prioValor = (p) => ({ "Alta": 3, "Média": 2, "Baixa": 1 }[p] || 0);

    if (ordenacao === "data_asc") {
        out.sort((a, b) => cmpStr(a.dataLimite, b.dataLimite) || prioValor(b.prioridade) - prioValor(a.prioridade));
    } else if (ordenacao === "data_desc") {
        out.sort((a, b) => cmpStr(b.dataLimite, a.dataLimite) || prioValor(a.prioridade) - prioValor(b.prioridade));
    } else if (ordenacao === "prioridade_asc") {
        out.sort((a, b) => prioValor(b.prioridade) - prioValor(a.prioridade) || cmpStr(a.dataLimite, b.dataLimite));
    } else if (ordenacao === "prioridade_desc") {
        out.sort((a, b) => prioValor(a.prioridade) - prioValor(b.prioridade) || cmpStr(a.dataLimite, b.dataLimite));
    } else if (ordenacao === "titulo_asc") {
        out.sort((a, b) => cmpStr(a.titulo, b.titulo));
    } else if (ordenacao === "titulo_desc") {
        out.sort((a, b) => cmpStr(b.titulo, a.titulo));
    }

    return out;
}

function renderizarLista() {
    listaContainer.innerHTML = "";

    const listaView = aplicarFiltrosOrdenacao(tarefas);

    if (listaView.length === 0) {
        listaContainer.innerHTML = `
      <div class="empty">
        <span class="emoji">✅</span>
        <div>
          <strong>Nenhuma tarefa encontrada</strong>
          <p>Altere os filtros ou adicione uma nova tarefa.</p>
        </div>
      </div>`;
        return;
    }

    listaView.forEach((tarefa) => {
        const idxReal = tarefas.indexOf(tarefa);
        const dias = diffDias(tarefa.dataLimite);
        const diasTxt = dias === null ? "-" : (dias < 0 ? `Vencida (${Math.abs(dias)}d)` : `${dias}d`);
        
        // Badge de status (cor baseada no status)
        const statusBadge = criarStatusBadge(tarefa.status);
        
        const row = document.createElement("div");
        row.className = "row-item";

        row.innerHTML = `
      <div>${tarefa.titulo}</div>
      <div>${criarPrioridadeBadge(tarefa.prioridade).outerHTML}</div>
      <div>${tarefa.dataLimite}</div>
      <div>${diasTxt}</div>
      <div></div>
      <div class="right">
        <button class="link-btn" data-action="status" data-index="${idxReal}" title="Alternar status">🔄</button>
        <button class="link-btn" data-action="editar" data-index="${idxReal}">Editar</button>
        <button class="link-btn" data-action="remover" data-index="${idxReal}">Remover</button>
      </div>
    `;

        row.children[4].appendChild(statusBadge);
        listaContainer.appendChild(row);
    });
}

/* ---------- Eventos UI ---------- */
function onSubmitForm(e) {
    e.preventDefault();
    try {
        adicionarTarefa({
            titulo: inputTitulo.value.trim(),
            descricao: inputDescricao.value.trim(),
            prioridade: inputPrioridade.value,
            dataLimite: inputDataLimite.value,
            categoria: inputCategoria.value,
        });

        form.reset();
        inputTitulo.focus();
        renderizarLista();
        setMsg("Tarefa adicionada com sucesso.", "sucesso");
    } catch (err) {
        setMsg(err.message, "erro");
    }
}

function limparFormulario() {
    form.reset();
    inputTitulo.focus();
}

function limparTudo() {
    if (!confirm("Tem certeza que deseja apagar todas as tarefas?")) return;
    tarefas = [];
    salvar();
    renderizarLista();
    setMsg("Todas as tarefas foram removidas.");
}

function abrirEdicao(idx) {
    idxEditando = idx;
    const tarefa = tarefas[idx];

    editTitulo.value = tarefa.titulo;
    editDescricao.value = tarefa.descricao || "";
    editPrioridade.value = tarefa.prioridade;
    editDataLimite.value = tarefa.dataLimite;
    editCategoria.value = tarefa.categoria;
    editStatus.value = tarefa.status;

    dlgEditar.showModal();
}

function fecharEdicao() {
    idxEditando = null;
    if (dlgEditar.open) dlgEditar.close();
}

function onSalvarEdicao(e) {
    e.preventDefault();
    if (idxEditando === null) return;

    try {
        atualizarTarefaPorIndice(idxEditando, {
            titulo: editTitulo.value.trim(),
            descricao: editDescricao.value.trim(),
            prioridade: editPrioridade.value,
            dataLimite: editDataLimite.value,
            categoria: editCategoria.value,
            status: editStatus.value,
        });

        fecharEdicao();
        renderizarLista();
        setMsg("Tarefa atualizada com sucesso.", "sucesso");
    } catch (err) {
        setMsg(err.message, "erro");
    }
}

function onToggleStatus(idx) {
    try {
        toggleStatusTarefa(idx);
        renderizarLista();
    } catch (err) {
        setMsg(err.message, "erro");
    }
}

function onClickLista(e) {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;
    const idx = Number(btn.dataset.index);

    if (action === "remover") {
        if (!confirm("Remover esta tarefa?")) return;
        removerTarefaPorIndice(idx);
        renderizarLista();
        setMsg("Tarefa removida.");
        return;
    }

    if (action === "editar") {
        abrirEdicao(idx);
        return;
    }

    if (action === "status") {
        onToggleStatus(idx);
        return;
    }
}

function onBuscar(e) {
    filtroTexto = e.target.value;
    renderizarLista();
}

function onFiltroCategoria(e) {
    filtroCategoria = e.target.value;
    renderizarLista();
}

function onFiltroStatus(e) {
    filtroStatus = e.target.value;
    renderizarLista();
}

function onOrdenar(e) {
    ordenacao = e.target.value;
    renderizarLista();
}

/* ---------- Init ---------- */
function init() {
    tarefas = carregar();
    renderizarLista();

    form.addEventListener("submit", onSubmitForm);
    btnLimpar.addEventListener("click", limparFormulario);
    btnApagarTudo.addEventListener("click", limparTudo);
    listaContainer.addEventListener("click", onClickLista);

    inputBuscar.addEventListener("input", onBuscar);
    selectFiltroCategoria.addEventListener("change", onFiltroCategoria);
    selectFiltroStatus.addEventListener("change", onFiltroStatus);
    selectOrdenar.addEventListener("change", onOrdenar);

    formEditar.addEventListener("submit", onSalvarEdicao);
    btnCancelarEdicao.addEventListener("click", fecharEdicao);

    // Fechar dialog clicando fora
    dlgEditar.addEventListener("click", (ev) => {
        const rect = dlgEditar.getBoundingClientRect();
        const inside =
            ev.clientX >= rect.left &&
            ev.clientX <= rect.right &&
            ev.clientY >= rect.top &&
            ev.clientY <= rect.bottom;
        if (!inside) fecharEdicao();
    });
}

init();
