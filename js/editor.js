// editor.js para compilador.html

// este script se encarga de la estetica de la aplicacion
// aqui se define el comportamiento del editor

function obtenerLineaActual(txtArea) {
	var t = $(txtArea);

	if (t.selectionEnd - t.selectionStart > 0) {
		if (t.selectionDirection == "forward")
			return $A(t.value).slice(0, t.selectionEnd).filter(function(c) { return c == '\n'; }).length + 1;
		else if (t.selectionDirection == "backward")
			return $A(t.value).slice(0, t.selectionStart).filter(function(c) { return c == '\n'; }).length + 1
	}
	else {
		return $A(t.value).slice(0, t.selectionEnd).filter(function(c) { return c == '\n'; }).length + 1;
	}
}

Event.observe(window, "load", function() {
	var editorHeight = 0; // para conocer la altura que tenia el editor al cambiarla

	$("editor").observe("click", function() {
		editorHeight = $(this).getHeight();
	});

	// cambiar la altura del textarea de los numeros de linea
	// a la misma del editor
	$("editor").observe("mousemove", function() {
		if ($(this).getHeight() != editorHeight) {
			$("n-lineas").setStyle({ height: $(this).getHeight() + "px" });
			editorHeight = $(this).getHeight();
		}
	});

	// cambiar la altura del textarea de los numeros de linea
	// a la misma del editor aunque el puntero no este sobre este
	$(document.documentElement).observe("mousemove", function() {
		if ($("editor").getHeight() != editorHeight) {
			$("n-lineas").setStyle({ height: $("editor").getHeight() - 1 + "px" });
			editorHeight = $("editor").getHeight();
		}
	});

	$("editor").observe("keydown", function(event) {
		var e = event || window.event;
		var codTecla = e.keyCode || e.charCode || e.which;
		var lineas = $F("editor").split('\n');
		var txtaLin = $("n-lineas");
		var dif = $(this).selectionEnd - $(this).selectionStart;
		var lnActual = obtenerLineaActual($("editor"));
		var lnSeleccionadas = $A($F("editor").substring($(this).selectionStart, $(this).selectionEnd)).filter(function(c) { return c == '\n'; }).length;

		if (codTecla == 13) {
			if (e.ctrlKey) return;
			if (lineas.length == 20) {
				$("editor").value = $F("editor").split('\n').slice(0, 19).join('\n');
				return false;
			}

			// enumerar la nueva linea, haya o no texto seleccionado
			if (dif > 0) txtaLin.value = txtaLin.value.split('\n').slice(0, (lineas.length - lnSeleccionadas) + 1).join('\n');
			else txtaLin.value += "\n" + (lineas.length + 1) + ".";

			// posicionar el cursor del contador de lineas en la misma que la del editor
			// NOTA: el punto concatenado al final es necesario para no dar con el indice
			// de una aparicion anterior o posterior de un numero de un digito
			if (dif > 0) txtaLin.selectionStart = txtaLin.value.indexOf(lnActual + ".");
			else txtaLin.selectionStart = txtaLin.value.indexOf((lnActual + 1) + ".");

			txtaLin.selectionEnd = txtaLin.selectionStart;
			txtaLin.focus();
		}
		else if (codTecla == 8) {
			// SOLUCION PENDIENTE: hacer bien el conteo de lineas cuando se combinan Ctrl + Backspace
			if (lineas.length == 1) { /* no hacer nada */ }
			else {
				if (lnActual == 1) return;
				if (lineas[lnActual - 1].length == 0) --lineas.length;
				
				if (dif > 0) txtaLin.value = txtaLin.value.split('\n').slice(0, lineas.length - lnSeleccionadas).join('\n');
				else txtaLin.value = txtaLin.value.split('\n').slice(0, lineas.length).join('\n');
			}
		}
		else if (codTecla == Event.KEY_DELETE) {
			// SOLUCION PENDIENTE: hacer bien el conteo de lineas cuando se combinan Ctrl + Delete
			if (lineas.length == 1) { /* no hacer nada*/ }
			else {
				if (lnActual == lineas.length && lnSeleccionadas == 0) return;
				if (lineas[lnActual - 1].length == 0) --lineas.length;

				if (dif > 0) txtaLin.value = txtaLin.value.split('\n').slice(0, lineas.length - lnSeleccionadas).join('\n');
				else txtaLin.value = txtaLin.value.split('\n').slice(0, lineas.length).join('\n');
			}
		}
		else if ([Event.KEY_UP, Event.KEY_DOWN, Event.KEY_LEFT, Event.KEY_RIGHT].include(codTecla)) {
			// SOLUCION PENDIENTE:
			// posicionar el cursor del contador de lineas en la misma del editor
			// al pulsar cualquiera de las teclas de direccion del teclado
			// TENIENDO EN CUENTA si la(s) tecla(s) se mantiene(n) pulsada(s)

			// DESHABILITADO: limitado a 20 lineas (las cuales caben en la parte visible del editor)
			txtaLin.selectionStart = txtaLin.value.indexOf((lnActual - 1) + ".");
			txtaLin.selectionEnd = txtaLin.selectionStart;
			txtaLin.focus();
		}
		else {
			if (e.ctrlKey) {
				if (['x', 'c', 'v'].include(String.fromCharCode(codTecla).toLowerCase())) {
					// cortar, copiar y pegar: quitar el foco del editor
					$(this).blur();
					alert("Accion no permitida: Ctrl + " + String.fromCharCode(codTecla) + ".");
				}
				else if (['z', 'y'].include(String.fromCharCode(codTecla).toLowerCase())) {
					// deshacer y rehacer
					// NOTA: se debe inhabilitar el editor para estos dos comandos porque de otra forma
					// se ejecutarian antes de poder quitar el foco del editor
					$("n-lineas", "editor").invoke("disable");
					alert("Accion no permitida: Ctrl + " + String.fromCharCode(codTecla) + ".");

					// sin el intervalo siguiente los comandos se ejecutarian antes de devolver el foco
					// al editor
					setTimeout(function() {
						$("n-lineas", "editor").invoke("enable");
						$("editor").selectionStart = $("editor").selectionEnd = $("editor").textLength;
						$("editor").focus();
					}, 0);
				}
			}
			else {
				// enumerar las lineas si se borran seleccionandolas y pulsando cualquier tecla
				// que no sea Backspace, Enter o Delete
				if (dif > 0) txtaLin.value = txtaLin.value.split('\n').slice(0, lineas.length - lnSeleccionadas).join('\n');
			}
		}
	});

	$("n-lineas").observe("focus", function() {
		$("editor").focus();
	});
});