document.addEventListener('DOMContentLoaded', function() {
    adicionarEstilosTabs();
    carregarReservas();
    carregarMesas(); 
    carregarGarcons();
    carregarMesasParaModalEdicao(); 
    const hoje = getTodayFormatted();
    document.getElementById('data_inicio').value = hoje;
    document.getElementById('data_fim').value = hoje;
    document.getElementById('edit_data').min = hoje; 
    document.getElementById('relatorio-periodo-form').addEventListener('submit', gerarRelatorioPorPeriodo);
    document.getElementById('relatorio-mesa-form').addEventListener('submit', gerarRelatorioPorMesa);
    document.getElementById('relatorio-garcom-form').addEventListener('submit', gerarRelatorioPorGarcom);
    document.getElementById('edit-reserva-form').addEventListener('submit', salvarEdicaoReserva); 
});

function adicionarEstilosTabs() {
    const style = document.createElement('style');
    style.textContent = `
        .tabs {
            display: flex;
            border-bottom: 1px solid #ddd;
            margin-bottom: 20px;
        }

        .tab-btn {
            background-color: #ffc746;
            border: none;
            outline: none;
            cursor: pointer;
            padding: 10px 20px;
            transition: 0.3s;
            font-size: 16px;
            border-radius: 5px 5px 0 0;
            margin-right: 5px;
            color: #000000;
        }

        .tab-btn:hover {
            background-color: #000000;
            color: #ffffff;
        }

        .tab-btn.active {
            background-color: #000000;
            color: #ffffff;
        }

        .tab-content {
            display: none;
            padding: 20px 0;
            border-top: none;
        }
    `;
    document.head.appendChild(style);
}

function openTab(evt, tabName) {
    const tabContents = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].style.display = 'none';
    }

    const tabButtons = document.getElementsByClassName('tab-btn');
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].className = tabButtons[i].className.replace(' active', '');
    }

    document.getElementById(tabName).style.display = 'block';
    evt.currentTarget.className += ' active';
}

async function carregarReservas() {
    try {
        const reservas = await fetchAPI('/reservas');
        const tbody = document.querySelector('#tabela-reservas tbody');
        tbody.innerHTML = '';

        if (reservas.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="9" style="text-align: center;">Não há reservas cadastradas.</td>'; 
            tbody.appendChild(tr);
        } else {
            reservas.forEach(reserva => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${reserva.id}</td>
                    <td>${reserva.data}</td>
                    <td>${reserva.hora}</td>
                    <td>${reserva.numero_mesa}</td>
                    <td>${reserva.qtde_pessoas}</td>
                    <td>${reserva.nome_responsavel}</td>
                    <td>${traduzirStatus(reserva.status)}</td>
                    <td>${reserva.garcom_atendimento || '-'}</td>
                    <td>
                        <button class="btn btn-sm" onclick="abrirModalEdicao(${reserva.id})">Editar</button>
                        <button class="btn btn-sm btn-danger" onclick="excluirReserva(${reserva.id})">Excluir</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (error) {
        showMessage('Erro ao carregar reservas: ' + error.message, true);
    }
}

async function carregarMesas() {
    try {
        const mesas = await fetchAPI('/mesas');
        const tbodyMesas = document.querySelector('#tabela-mesas tbody');
        tbodyMesas.innerHTML = '';
        mesas.forEach(mesa => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${mesa.numero_mesa}</td>
                <td>${mesa.capacidade} pessoas</td>
                <td>${traduzirStatusMesa(mesa.status)}</td>
                <td>
                    ${mesa.status !== 'livre' ? 
                        `<button class="btn" onclick="liberarMesa(${mesa.numero_mesa})">Liberar</button>` :
                        '-'}
                </td>
            `;
            tbodyMesas.appendChild(tr);
        });
        const selectMesaRelatorio = document.getElementById('relatorio_numero_mesa');
        while (selectMesaRelatorio.options.length > 1) {
            selectMesaRelatorio.remove(1);
        }
        mesas.forEach(mesa => {
            const option = document.createElement('option');
            option.value = mesa.numero_mesa;
            option.textContent = `Mesa ${mesa.numero_mesa} (${mesa.capacidade} lugares)`;
            selectMesaRelatorio.appendChild(option);
        });

    } catch (error) {
        showMessage('Erro ao carregar mesas: ' + error.message, true);
    }
}

async function carregarMesasParaModalEdicao() {
    try {
        const mesas = await fetchAPI('/mesas');
        const selectMesaEdicao = document.getElementById('edit_numero_mesa');
        while (selectMesaEdicao.options.length > 1) {
            selectMesaEdicao.remove(1);
        }
        mesas.forEach(mesa => {
            const option = document.createElement('option');
            option.value = mesa.numero_mesa;
            option.textContent = `Mesa ${mesa.numero_mesa} (${mesa.capacidade} lugares)`;
            selectMesaEdicao.appendChild(option);
        });
    } catch (error) {
        showMessage('Erro ao carregar mesas para edição: ' + error.message, true);
    }
}

async function carregarGarcons() {
    try {
        const garcons = await fetchAPI('/garcons');
        const tbodyGarcons = document.querySelector('#tabela-garcons tbody');
        tbodyGarcons.innerHTML = '';
        if (garcons.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="2" style="text-align: center;">Não há garçons cadastrados.</td>';
            tbodyGarcons.appendChild(tr);
        } else {
            garcons.forEach(garcom => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${garcom.id}</td>
                    <td>${garcom.nome}</td>
                `;
                tbodyGarcons.appendChild(tr);
            });
        }
        const selectGarcom = document.getElementById('relatorio_garcom_nome');
        while (selectGarcom.options.length > 1) {
            selectGarcom.remove(1);
        }
        garcons.forEach(garcom => {
            const option = document.createElement('option');
            option.value = garcom.nome;
            option.textContent = garcom.nome;
            selectGarcom.appendChild(option);
        });
    } catch (error) {
        showMessage('Erro ao carregar garçons: ' + error.message, true);
    }
}

async function liberarMesa(numeroMesa) {
    if (!confirm(`Tem certeza que deseja liberar a mesa ${numeroMesa}? Isso pode afetar reservas associadas.`)) {
        return;
    }
    try {
        const response = await fetchAPI(`/mesas/${numeroMesa}/liberar`, 'PATCH');
        showMessage(response.message);
        carregarMesas(); 
        carregarReservas(); 
    } catch (error) {
        showMessage('Erro ao liberar mesa: ' + error.message, true);
    }
}

async function abrirModalEdicao(reservaId) {
    try {
        const reserva = await fetchAPI(`/reservas/${reservaId}`);
        document.getElementById('edit_reserva_id').value = reserva.id;
        document.getElementById('edit_nome_responsavel').value = reserva.nome_responsavel;
        document.getElementById('edit_data').value = reserva.data;
        document.getElementById('edit_hora').value = reserva.hora;
        document.getElementById('edit_qtde_pessoas').value = reserva.qtde_pessoas;
        document.getElementById('edit_numero_mesa').value = reserva.numero_mesa;
        document.getElementById('editReservaModal').style.display = 'block';
    } catch (error) {
        showMessage('Erro ao carregar dados da reserva para edição: ' + error.message, true);
    }
}
function fecharModalEdicao() {
    document.getElementById('editReservaModal').style.display = 'none';
}
async function salvarEdicaoReserva(event) {
    event.preventDefault();
    const reservaId = document.getElementById('edit_reserva_id').value;
    const nome_responsavel = document.getElementById('edit_nome_responsavel').value;
    const data = document.getElementById('edit_data').value;
    const hora = document.getElementById('edit_hora').value;
    const qtde_pessoas = parseInt(document.getElementById('edit_qtde_pessoas').value);
    const numero_mesa = parseInt(document.getElementById('edit_numero_mesa').value);
    if (!nome_responsavel || !data || !hora || isNaN(qtde_pessoas) || isNaN(numero_mesa)) {
        showMessage('Por favor, preencha todos os campos corretamente no formulário de edição.', true);
        return;
    }

    try {
        const reservaData = {
            nome_responsavel,
            data,
            hora,
            qtde_pessoas,
            numero_mesa
        };

        const response = await fetchAPI(`/reservas/${reservaId}`, 'PUT', reservaData);
        showMessage(response.message);
        fecharModalEdicao();
        carregarReservas();
        carregarMesas(); 
    } catch (error) {
        showMessage('Erro ao salvar alterações da reserva: ' + error.message, true);
    }
}
async function excluirReserva(reservaId) {
    if (!confirm(`Tem certeza que deseja excluir a reserva ${reservaId}?`)) {
        return;
    }
    try {
        const response = await fetchAPI(`/reservas/${reservaId}`, 'DELETE');
        showMessage(response.message);
        carregarReservas(); 
        carregarMesas(); 
    } catch (error) {
        showMessage('Erro ao excluir reserva: ' + error.message, true);
    }
}

async function gerarRelatorioPorPeriodo(event) {
    event.preventDefault();
    const dataInicio = document.getElementById('data_inicio').value;
    const dataFim = document.getElementById('data_fim').value;
    if (!dataInicio || !dataFim) {
        showMessage('Por favor, informe as datas inicial e final.', true);
        return;
    }

    try {
        const reservas = await fetchAPI(`/relatorios/periodo?data_inicio=${dataInicio}&data_fim=${dataFim}`);
        const tbody = document.querySelector('#tabela-relatorio-periodo tbody');
        tbody.innerHTML = '';

        if (reservas.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="8" style="text-align: center;">Não há reservas no período selecionado.</td>';
            tbody.appendChild(tr);
        } else {
            reservas.forEach(reserva => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${reserva.id}</td>
                    <td>${reserva.data}</td>
                    <td>${reserva.hora}</td>
                    <td>${reserva.numero_mesa}</td>
                    <td>${reserva.qtde_pessoas}</td>
                    <td>${reserva.nome_responsavel}</td>
                    <td>${traduzirStatus(reserva.status)}</td>
                    <td>${reserva.garcom_atendimento || '-'}</td>
                `;
                tbody.appendChild(tr);
            });
        }

        document.getElementById('relatorio-periodo-resultado').style.display = 'block';
    } catch (error) {
        if (error.message.includes('Nenhuma reserva encontrada')) {
            const tbody = document.querySelector('#tabela-relatorio-periodo tbody');
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Não há reservas no período selecionado.</td></tr>';
            document.getElementById('relatorio-periodo-resultado').style.display = 'block';
        } else {
            showMessage('Erro ao gerar relatório: ' + error.message, true);
            document.getElementById('relatorio-periodo-resultado').style.display = 'none';
        }
    }
}

async function gerarRelatorioPorMesa(event) {
    event.preventDefault();

    const numeroMesa = document.getElementById('relatorio_numero_mesa').value;
    const dataInicio = document.getElementById('mesa_data_inicio').value;
    const dataFim = document.getElementById('mesa_data_fim').value;

    if (!numeroMesa) {
        showMessage('Por favor, selecione uma mesa.', true);
        return;
    }

    try {
        let url = `/relatorios/mesa?numero_mesa=${numeroMesa}`;
        if (dataInicio && dataFim) {
            url += `&data_inicio=${dataInicio}&data_fim=${dataFim}`;
        }

        const reservas = await fetchAPI(url);
        const tbody = document.querySelector('#tabela-relatorio-mesa tbody');
        tbody.innerHTML = '';

        if (reservas.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="7" style="text-align: center;">Não há reservas para esta mesa no período selecionado.</td>';
            tbody.appendChild(tr);
        } else {
            reservas.forEach(reserva => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${reserva.id}</td>
                    <td>${reserva.data}</td>
                    <td>${reserva.hora}</td>
                    <td>${reserva.qtde_pessoas}</td>
                    <td>${reserva.nome_responsavel}</td>
                    <td>${traduzirStatus(reserva.status)}</td>
                    <td>${reserva.garcom_atendimento || '-'}</td>
                `;
                tbody.appendChild(tr);
            });
        }

        document.getElementById('relatorio-mesa-resultado').style.display = 'block';
    } catch (error) {
        if (error.message.includes('Nenhuma reserva encontrada')) {
            const tbody = document.querySelector('#tabela-relatorio-mesa tbody');
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Não há reservas para esta mesa no período selecionado.</td></tr>';
            document.getElementById('relatorio-mesa-resultado').style.display = 'block';
        } else {
            showMessage('Erro ao gerar relatório: ' + error.message, true);
            document.getElementById('relatorio-mesa-resultado').style.display = 'none';
        }
    }
}

async function gerarRelatorioPorGarcom(event) {
    event.preventDefault();
    const garcomNome = document.getElementById('relatorio_garcom_nome').value;
    const dataInicio = document.getElementById('garcom_data_inicio').value;
    const dataFim = document.getElementById('garcom_data_fim').value;

    if (!garcomNome) {
        showMessage('Por favor, selecione um garçom.', true);
        return;
    }

    try {
        let url = `/relatorios/garcom?nome=${garcomNome}`;
        if (dataInicio && dataFim) {
            url += `&data_inicio=${dataInicio}&data_fim=${dataFim}`;
        }

        const reservas = await fetchAPI(url);
        const tbody = document.querySelector('#tabela-relatorio-garcom tbody');
        tbody.innerHTML = '';

        if (reservas.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="7" style="text-align: center;">Não há reservas atendidas por este garçom no período selecionado.</td>';
            tbody.appendChild(tr);
        } else {
            reservas.forEach(reserva => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${reserva.id}</td>
                    <td>${reserva.data}</td>
                    <td>${reserva.hora}</td>
                    <td>${reserva.numero_mesa}</td>
                    <td>${reserva.qtde_pessoas}</td>
                    <td>${reserva.nome_responsavel}</td>
                    <td>${reserva.status}</td>
                `;
                tbody.appendChild(tr);
            });
        }

        document.getElementById('relatorio-garcom-resultado').style.display = 'block';
    } catch (error) {
        if (error.message.includes('Nenhuma reserva atendida encontrada')) {
            const tbody = document.querySelector('#tabela-relatorio-garcom tbody');
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Não há reservas atendidas por este garçom no período selecionado.</td></tr>';
            document.getElementById('relatorio-garcom-resultado').style.display = 'block';
        } else {
            showMessage('Erro ao gerar relatório: ' + error.message, true);
            document.getElementById('relatorio-garcom-resultado').style.display = 'none';
        }
    }
}

function traduzirStatus(status) {
    const statusMap = {
        'pendente': 'Pendente',
        'atendida': 'Atendida',
        'cancelada': 'Cancelada'
    };
    return statusMap[status] || status;
}

function traduzirStatusMesa(status) {
    const statusMap = {
        'livre': 'Livre',
        'reservada': 'Reservada',
        'ocupada': 'Ocupada'
    };
    return statusMap[status] || status;
}

function getTodayFormatted() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
