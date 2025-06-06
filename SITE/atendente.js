let currentReservaId = null; 
let currentReservaData = null; 
document.addEventListener("DOMContentLoaded", function() {
    carregarMesasParaSelect("numero_mesa");
    carregarMesasParaSelect("edit_numero_mesa_cliente");
    const hoje = getTodayFormatted();
    document.getElementById("data").min = hoje;
    document.getElementById("edit_data_cliente").min = hoje;
    document.getElementById("reserva-form").addEventListener("submit", fazerReserva);
    document.getElementById("consulta-form").addEventListener("submit", consultarReserva);
    document.getElementById("edit-reserva-form-cliente").addEventListener("submit", salvarEdicaoReservaCliente);
    document.getElementById("numero_mesa").addEventListener("change", notificarSelecaoMesa);
});
async function carregarMesasParaSelect(selectId) {
    try {
        const mesas = await fetchAPI("/mesas/");
        const selectMesa = document.getElementById(selectId);
        while (selectMesa.options.length > 1) {
            selectMesa.remove(1);
        }
        mesas.forEach(mesa => {
            const option = document.createElement("option");
            option.value = mesa.numero_mesa;
            if (selectId === "numero_mesa") {
                 option.textContent = `Mesa ${mesa.numero_mesa} (${mesa.capacidade} lugares) - ${mesa.status === 'livre' ? 'Disponível' : 'Ocupada/Reservada'}`;
                 if (mesa.status !== 'livre') {
                    option.style.color = '#999';
                    option.style.fontStyle = 'italic';
                 }
            } else {
                 option.textContent = `Mesa ${mesa.numero_mesa} (${mesa.capacidade} lugares)`;
            }
            selectMesa.appendChild(option);
        });
    } catch (error) {
        showMessage(`Erro ao carregar mesas para ${selectId}: ` + error.message, true);
    }
}
function notificarSelecaoMesa(event) {
    const mesaSelecionada = event.target.value;
    if (mesaSelecionada) {
        const textoMesa = event.target.options[event.target.selectedIndex].text;
        showMessage(`Mesa ${mesaSelecionada} selecionada. ${textoMesa.split(' - ')[0]}`, false);
    }
}
async function fazerReserva(event) {
    event.preventDefault();
    const nome_responsavel = document.getElementById("nome_responsavel").value;
    const data = document.getElementById("data").value;
    const hora = document.getElementById("hora").value;
    const qtde_pessoas = parseInt(document.getElementById("qtde_pessoas").value);
    const numero_mesa = parseInt(document.getElementById("numero_mesa").value);
    if (!nome_responsavel || !data || !hora || isNaN(qtde_pessoas) || isNaN(numero_mesa)) {
        showMessage("Por favor, preencha todos os campos corretamente.", true);
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

        const response = await fetchAPI("/reservas", "POST", reservaData);
        window.alert(`Reserva criada com sucesso! Seu número de reserva é: ${response.reservaId}`);

        
        document.getElementById("reserva-form").reset();

       
        carregarMesasParaSelect("numero_mesa");
    } catch (error) {
        window.alert("Erro ao fazer reserva: " + error.message, true);
    }
}

async function consultarReserva(event) {
    event.preventDefault();
    const reservaIdInput = document.getElementById("reserva_id");
    const reservaId = reservaIdInput.value;
    if (!reservaId) {
        showMessage("Por favor, informe o número da reserva.", true);
        return;
    }
    try {
        const reserva = await fetchAPI(`/reservas/${reservaId}`);
        currentReservaId = reserva.id; 
        currentReservaData = reserva; 
        const reservaInfo = document.getElementById("reserva-info");
        reservaInfo.innerHTML = `
            <p><strong>Nome:</strong> ${reserva.nome_responsavel}</p>
            <p><strong>Data:</strong> ${reserva.data}</p>
            <p><strong>Hora:</strong> ${reserva.hora}</p>
            <p><strong>Mesa:</strong> ${reserva.numero_mesa}</p>
            <p><strong>Pessoas:</strong> ${reserva.qtde_pessoas}</p>
            <p><strong>Status:</strong> ${traduzirStatus(reserva.status)}</p>
            ${reserva.garcom_atendimento ? `<p><strong>Garçom:</strong> ${reserva.garcom_atendimento}</p>` : ''}
        `;
        document.getElementById("reserva-detalhes").style.display = "block";
        const btnEditar = document.getElementById("btn-editar-reserva");
        const btnExcluir = document.getElementById("btn-excluir-reserva");
        if (reserva.status === 'pendente') {
            btnEditar.style.display = "inline-block";
            btnExcluir.style.display = "inline-block";
        } else {
            btnEditar.style.display = "none";
            btnExcluir.style.display = "none";
            showMessage("Reservas já atendidas ou canceladas não podem ser editadas ou excluídas.", false);
        }
    } catch (error) {
        showMessage("Erro ao consultar reserva: " + error.message, true);
        document.getElementById("reserva-detalhes").style.display = "none";
        document.getElementById("btn-editar-reserva").style.display = "none";
        document.getElementById("btn-excluir-reserva").style.display = "none";
        currentReservaId = null;
        currentReservaData = null;
    }
}
function abrirModalEdicaoCliente() {
    if (!currentReservaData) {
        showMessage("Nenhuma reserva carregada para edição.", true);
        return;
    }
    document.getElementById("edit_reserva_id_cliente").value = currentReservaData.id;
    document.getElementById("edit_nome_responsavel_cliente").value = currentReservaData.nome_responsavel;
    document.getElementById("edit_data_cliente").value = currentReservaData.data;
    document.getElementById("edit_hora_cliente").value = currentReservaData.hora;
    document.getElementById("edit_qtde_pessoas_cliente").value = currentReservaData.qtde_pessoas;
    document.getElementById("edit_numero_mesa_cliente").value = currentReservaData.numero_mesa;
    document.getElementById("editReservaModalCliente").style.display = "block";
}
function fecharModalEdicaoCliente() {
    document.getElementById("editReservaModalCliente").style.display = "none";
}
async function salvarEdicaoReservaCliente(event) {
    event.preventDefault();
    const reservaId = document.getElementById("edit_reserva_id_cliente").value;
    const nome_responsavel = document.getElementById("edit_nome_responsavel_cliente").value;
    const data = document.getElementById("edit_data_cliente").value;
    const hora = document.getElementById("edit_hora_cliente").value;
    const qtde_pessoas = parseInt(document.getElementById("edit_qtde_pessoas_cliente").value);
    const numero_mesa = parseInt(document.getElementById("edit_numero_mesa_cliente").value);
    if (!nome_responsavel || !data || !hora || isNaN(qtde_pessoas) || isNaN(numero_mesa)) {
        showMessage("Por favor, preencha todos os campos corretamente no formulário de edição.", true);
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

        const response = await fetchAPI(`/reservas/${reservaId}`, "PUT", reservaData);
        window.alert("Número de reserva editado com sucesso!");
        fecharModalEdicaoCliente();
        document.getElementById("consulta-form").dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        carregarMesasParaSelect("numero_mesa");
    } catch (error) {
        window.alert("Erro ao salvar alterações da reserva: " + error.message, true);
    }
}
async function excluirReservaCliente() {
    if (!currentReservaId) {
        showMessage("Nenhuma reserva selecionada para exclusão.", true);
        return;
    }

    if (!confirm(`Tem certeza que deseja excluir a reserva ${currentReservaId}?`)) {
        return;
    }

    try {
        const response = await fetchAPI(`/reservas/${currentReservaId}`, 'DELETE');
        window.alert("Reserva excluída com sucesso!");
        document.getElementById("reserva-info").innerHTML = "";
        document.getElementById("reserva-detalhes").style.display = "none";
        document.getElementById("btn-editar-reserva").style.display = "none";
        document.getElementById("btn-excluir-reserva").style.display = "none";
        document.getElementById("reserva_id").value = ""; 
        currentReservaId = null;
        currentReservaData = null;
        carregarMesasParaSelect("numero_mesa");
    } catch (error) {
        showMessage('Erro ao excluir reserva: ' + error.message, true);
    }
}
function traduzirStatus(status) {
    const statusMap = {
        "pendente": "Pendente",
        "atendida": "Atendida",
        "cancelada": "Cancelada"
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

