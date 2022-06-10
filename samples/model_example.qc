
// This is a simple example QC file

// The output file name
$modelname "props_examples/example.mdl"

// Our input model
$body body "example.xml"

// Sequence has to be declared. Refer to the body's dmx file to use an empty animation
$sequence "idle" "example.dmx"

// We want to be a static prop
$staticprop

// Our collision model
$collisionmodel "example_phys.dmx"

// This model's materials are relative to these paths. Keep / as a fallback just in case
$cdmaterials "/"
$cdmaterials "models/props_examples/"

$definevariable Test "test"
$model $Test$
$model -$Test$