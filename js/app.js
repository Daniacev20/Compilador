// app.js para compilador.html

/*
Operaciones soportadas por la aplicacion:
-operaciones (+ - * / ^)
-comentarios de una linea (con un punto y coma)
-manejo de errores.

Operaciones invalidas:
-numeros negativos.
-numeros decimales.
*/

// extension de la clase String con metodos para:
// ignorar comentarios y espacios en blanco
String.prototype.ignoreComments = function(separator) {
	if (this.indexOf(separator) > -1) return this.substring(0, this.indexOf(separator));
	return this;
};

String.prototype.quitWS = function() {
	return this.replace(/\s/g, "");
};

var signos = $H({
	'+': 1,
	'-': 1,
	'/': 2,
	'*': 2,
	'^': 3,
	'(': 4,
	')': 4
});

// creacion de clase sError para mostrar mensajes de error personalizados
var sError = Class.create();
sError.prototype = {
	initialize: function(ln, m) {
		this.nLinea = ln;
		this.msg = "Error en linea " + this.nLinea + ": " + m;
	}
};

// objeto para realizar los calculos de los operadores encontrados
function resolverOperacion(a, b, operacion) {
	switch (operacion) {
		case "+": return a + b;
		case "-": return a - b;
		case "*": return a * b;
		case "/": return b != 0 ? a / b : 0;
		case "^":
			return (function(base, exponente) {
				// equivalente a Math.pow(base, exponente)
				var potencia = 1;

				for (var i = 0; i < exponente; i++) potencia *= base;
				return potencia;
			})(a, b);
		default: return 0;
	}
}

Event.observe(window, "load", function() {
	// traduccion y deteccion de errores al pulsar el boton de compilar
	$("btn-compilar").observe("click", function() {
		var expresiones = []; // lineas de tokens
		var err = []; // lineas con errores
		var ln = $F("editor").split('\n').map(function(elem) {
			return elem.ignoreComments(';').quitWS();
		});

		ln.each(function(lnActual, indice) {
			var num = "";
			var expr = []; // tokens de la linea actual
			var parentesis_abierto = 0;

			$A(lnActual).each(function(c, i)  { // recorrer linea actual por caracter
				if (!isNaN(c)) { // si es un digito
					num += c;

					if (i == lnActual.length - 1) {
						if (parentesis_abierto > 0){
							err.push(new sError((indice + 1), "Se ha(n) dejado " + parentesis_abierto + " parentesis abierto(s)."));
						}
						else if (parentesis_abierto < 0) {
							err.push(new sError((indice + 1), "Se ha(n) cerrado " + parentesis_abierto * (-1) + " parentesis de mas."));
						}
						else {
							expr.push(num);
							expresiones.push(expr);
						}
					}
				}
				else if (!signos.keys().include(c)) { // si no es digito ni es un simbolo de signos
					err.push(new sError((indice + 1), "El token '" + c + "' no es soportado en la expresion."));
				}
				else { // si es un operador o parentesis
					if (c == '(') parentesis_abierto++;
					else if (c == ')') parentesis_abierto--;

					if (i == 0 && c != '(') err.push(new sError((indice + 1), "Se esperaba operando antes del operador " + c));

					if ($w("+ - * / ^").include(c) && $w("+ - * / ^").include(lnActual[i + 1]) || $w("+ - * / ^").include(c) && ')' == lnActual[i + 1]) {
						err.push(new sError((indice + 1), "Se esperaba operando despues del operador " + c + "."));
					}
					else {
						if (num != "") expr.push(num);
						expr.push(c);
						num = "";

						if (i == lnActual.length - 1) {
							if (c != ')')
								err.push(new sError((indice + 1), "Se esperaba un digito, o fin de la expresion."));
							else if (parentesis_abierto > 0)
								err.push(new sError((indice + 1), "Se ha(n) dejado " + parentesis_abierto + " parentesis abierto(s)."));
							else if (parentesis_abierto < 0)
								err.push(new sError((indice + 1), "Se ha(n) cerrado " + parentesis_abierto * (-1) + " parentesis de mas."));
							else
								expresiones.push(expr);
						}
					}
				}
			});
		});

		if (err.length > 0) {
			// borrar las lineas traducidas
			$("traduccion").update();
			$("resultados").update();

			var str = "";

			str = err.map(function(ex) { // lista de mensajes de error separados por linea
				return ex.msg;
			}).join("<br />");

			$("info-err").update("Errores: " + err.length + "<br />" + str);

			// bajar el scroll hasta el elemento de id "final" si hay errores ya que
			// la presentacion y el editor no permiten verlos
			$("final").scrollTo();
		}
		else {
			// borrar los informes de error si esta bien
			$("info-err").update();

			// solucion e impresion:
			/*se hace en esta parte para abstraer la logica de la solucion
			de la empleada para la deteccion de errores*/

			var postfijos = [];
			var resultados = [];

			expresiones.each(function(linea, indice) {
				var cola = [];
				var pila = [];
				var pilaAbstracta = [];

				// traduccion al postfijo
				linea.each(function(c, i) {
					if (!isNaN(c)) {
						cola.push(c);

						if (linea[i + 1] == '(') pila.push('*'); // numero seguido de '(' es multiplicacion: agrega '*' a la pila
					}
					else {
						if (pila.include('(') && c != ')') {
							while (signos.get(c) <= signos.get(pila.last()) && pila.last() != '(') cola.push(pila.pop());
							pila.push(c);
						}
						else {
							if (c == ')') {
								while (pila.last() != '(') cola.push(pila.pop());
								pila.pop();

								// ')' seguido de '(' o numero es multiplicacion: agrega '*' a la pila
								if (linea[i + 1] == '(' || !isNaN(linea[i + 1])) pila.push('*');
								return;
							}

							while (signos.get(c) <= signos.get(pila.last())) cola.push(pila.pop());
							pila.push(c);
						}
					}
				});

				while (pila.length > 0) cola.push(pila.pop());
				postfijos.push(cola);

				// pila abstracta
				cola.each(function(c) {
					if (!isNaN(c)) { pilaAbstracta.push(c); }
					else {
						var b = pilaAbstracta.pop();
						var a = pilaAbstracta.pop();
						pilaAbstracta.push(resolverOperacion(parseInt(a), parseInt(b), c));
					}
				});
				resultados.push(pilaAbstracta.compact());
			});

			$("traduccion").update((function() {
				var str = "";
				postfijos.each(function(elem) {
					str += "[" + elem.join(" | ") + "]<br />";
				});
				return str;
			})());
			
			$("resultados").update(resultados.join("<br />"));
		}
	});
});

/*
Algunas expresiones con errores para probar el compilador

10-                 ;termina con un operador
1(29-2(8-3(3*2(1    ;parentesis abiertos
3(9-3))))           ;parentesis cerrados de mas
3(9-3)^2#1          ;token no valido (#)
(2-^2*)             ;falta un operando despues de - y * (operadores
                    ; consecutivos)
-3-5                ;empieza por un operador
*/