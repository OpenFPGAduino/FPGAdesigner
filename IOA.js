Blockly.Blocks['io_a'] = {
  init: function() {
    this.appendValueInput("A1")
        .setCheck(null)
        .appendField("A1");
    this.appendValueInput("A2")
        .setCheck(null)
        .appendField("A2");
    this.appendValueInput("A3")
        .setCheck(null)
        .appendField("A3");
	this.appendValueInput("A4")
        .setCheck(null)
        .appendField("A4");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(290);
    this.setTooltip('');
    this.setHelpUrl('http://www.example.com/');
  }
};