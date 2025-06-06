document.addEventListener('DOMContentLoaded', function() {
    carregarGarcons();
    carregarMesas();
    document.getElementById('busca-reserva-form').addEventListener('submit', buscarReserva);
    document.getElementById('form-atender').addEventListener('submit', atenderReserva);
    document.getElementById('busca-mesa-form').addEventListener('submit', buscarReservasPorMesa);
    document.getElementById('liberar-mesa-form').addEventListener('submit', liberarMesa);
});
async function carregarGarcons() {
    try {
        const garcons = await fetchAPI('/garcons');
        const selectGarcom = document.getElementById('garcom_nome');
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
async function carregarMesas() {
    try {
        const mesas = await fetchAPI('/mesas');
        const selectMesa = document.getElementById('numero_mesa');
        const selectMesaLiberar = document.getElementById('mesa_liberar');
        while (selectMesa.options.length > 1) {
            selectMesa.remove(1);
        }
        while (selectMesaLiberar.options.length > 1) {
            selectMesaLiberar.remove(1);
        }
        mesas.forEach(mesa => {
            const option1 = document.createElement('option');
            option1.value = mesa.numero_mesa;
            option1.textContent = `Mesa ${mesa.numero_mesa} (${mesa.capacidade} lugares) - ${traduzirStatusMesa(mesa.status)}`;
            selectMesa.appendChild(option1);
            const option2 = document.createElement('option');
            option2.value = mesa.numero_mesa;
            option2.textContent = `Mesa ${mesa.numero_mesa} (${mesa.capacidade} lugares) - ${traduzirStatusMesa(mesa.status)}`;
            option2.disabled = mesa.status === 'livre';
            selectMesaLiberar.appendChild(option2);
        });
    } catch (error) {
        showMessage('Erro ao carregar mesas: ' + error.message, true);
    }
}
async function buscarReserva(event) {
    event.preventDefault();
    const reservaId = document.getElementById('reserva_id').value;
    if (!reservaId) {
        showMessage('Por favor, informe o número da reserva.', true);
        return;
    }
    try {
        const reserva = await fetchAPI(`/reservas/${reservaId}`);
        const reservaInfo = document.getElementById('reserva-info');
        reservaInfo.innerHTML = `
            <p><strong>Nome:</strong> ${reserva.nome_responsavel}</p>
            <p><strong>Data:</strong> ${reserva.data}</p>
            <p><strong>Hora:</strong> ${reserva.hora}</p>
            <p><strong>Mesa:</strong> ${reserva.numero_mesa}</p>
            <p><strong>Pessoas:</strong> ${reserva.qtde_pessoas}</p>
            <p><strong>Status:</strong> ${traduzirStatus(reserva.status)}</p>
            ${reserva.garcom_atendimento ? `<p><strong>Garçom:</strong> ${reserva.garcom_atendimento}</p>` : ''}
        `;
        document.getElementById('reserva-detalhes').style.display = 'block';
        if (reserva.status === 'pendente') {
            document.getElementById('atendimento-form').style.display = 'block';
            document.getElementById('reserva_id_atender').value = reservaId;
        } else {
            document.getElementById('atendimento-form').style.display = 'none';
            if (reserva.status === 'atendida') {
                showMessage('Esta reserva já foi atendida.', false);
            } else if (reserva.status === 'cancelada') {
                showMessage('Esta reserva foi cancelada.', true);
            }
        }
    } catch (error) {
        showMessage('Erro ao buscar reserva: ' + error.message, true);
        document.getElementById('reserva-detalhes').style.display = 'none';
        document.getElementById('atendimento-form').style.display = 'none';
    }
}
async function atenderReserva(event) {
    event.preventDefault();
    const reservaId = document.getElementById('reserva_id_atender').value;
    const garcomNome = document.getElementById('garcom_nome').value;
    if (!reservaId || !garcomNome) {
        showMessage('Por favor, selecione um garçom.', true);
        return;
    }
    
    try {
        const response = await fetchAPI(`/reservas/${reservaId}/atender`, 'PATCH', { garcom_nome: garcomNome });
        showMessage(response.message);
        buscarReserva({ preventDefault: () => {} });
        carregarMesas();
    } catch (error) {
        showMessage('Erro ao atender reserva: ' + error.message, true);
    }
}

async function buscarReservasPorMesa(event) {
    event.preventDefault();
    const numeroMesa = document.getElementById('numero_mesa').value;
    if (!numeroMesa) {
        showMessage('Por favor, selecione uma mesa.', true);
        return;
    }
    
    try {
        const hoje = getTodayFormatted();
        const umMesDepois = formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
        const reservas = await fetchAPI(`/relatorios/mesa?numero_mesa=${numeroMesa}&data_inicio=${hoje}&data_fim=${umMesDepois}`);
        const listaReservas = document.getElementById('lista-reservas-mesa');
        if (reservas.length === 0) {
            listaReservas.innerHTML = '<p>Não há reservas para esta mesa.</p>';
        } else {
            let html = '<table><thead><tr><th>ID</th><th>Data</th><th>Hora</th><th>Nome</th><th>Status</th><th>Ação</th></tr></thead><tbody>';
            reservas.forEach(reserva => {
                html += `
                    <tr>
                        <td>${reserva.id}</td>
                        <td>${reserva.data}</td>
                        <td>${reserva.hora}</td>
                        <td>${reserva.nome_responsavel}</td>
                        <td>${traduzirStatus(reserva.status)}</td>
                        <td>
                            ${reserva.status === 'pendente' ? 
                                `<button class="btn" onclick="preencherReservaId(${reserva.id})">Atender</button>` : 
                                ''}
                        </td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
            listaReservas.innerHTML = html;
        }
        document.getElementById('reservas-mesa').style.display = 'block';
    } catch (error) {
        if (error.message.includes('Nenhuma reserva encontrada')) {
            const listaReservas = document.getElementById('lista-reservas-mesa');
            listaReservas.innerHTML = '<p>Não há reservas para esta mesa.</p>';
            document.getElementById('reservas-mesa').style.display = 'block';
        } else {
            showMessage('Erro ao buscar reservas: ' + error.message, true);
            document.getElementById('reservas-mesa').style.display = 'none';
        }
    }
}
async function liberarMesa(event) {
    event.preventDefault();
    const numeroMesa = document.getElementById('mesa_liberar').value;
    if (!numeroMesa) {
        showMessage('Por favor, selecione uma mesa.', true);
        return;
    }
    try {
        const response = await fetchAPI(`/mesas/${numeroMesa}/liberar`, 'PATCH');
        showMessage(response.message);
        carregarMesas();
    } catch (error) {
        showMessage('Erro ao liberar mesa: ' + error.message, true);
    }
}
function preencherReservaId(id) {
    document.getElementById('reserva_id').value = id;
    document.getElementById('busca-reserva-form').dispatchEvent(new Event('submit'));
    document.getElementById('busca-reserva-form').scrollIntoView({ behavior: 'smooth' });
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
