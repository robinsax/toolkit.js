/*
    Unit tests on toolkit.js.
*/
//  Define utilities.
var _failed = [];
function startCase(label){
    console.log('---- Running test: ' + label + ' ----');
}

function check(label, condition){
    console.log('\t| - ' + label);
    if (!condition){
        _failed.push(condition);
        console.log('\t\tFailed!');
    }
}

function checkElement(label, element, inspection){
    check(label, inspection(element));
}

//  Begin tests.
var tk = createToolkit();

tk.init(function(){
    basicTests();
    console.log(_failed.length > 0 ? 'Failed!' : 'Success');
});

//  Test function definitions.
function basicTests(){
    startCase('Initialization context');
    var divs = tk('div')
    check('Existing element selection', divs.length == 1);

    checkElement(
        'Classification', 
        divs.classify('classed', true).ith(0, false), 
        function(e){
            return e.getAttribute('class').trim() == 'classed';
        }
    );
}