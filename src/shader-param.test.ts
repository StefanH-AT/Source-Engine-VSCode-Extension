
import { ShaderParam } from './shader-param'
const packageJson = require('../package.json');

// This is a pretty dirty unit test. It's more of a method to validate the configuration.
test("Validate shader param config in package.json", () => {
    const params = packageJson.contributes.configuration.properties["source-engine.shaderParameters"].default;
    
    let i = 0;
    params.forEach((p: any) => {
        expect(p.name, `Element ${i} does not have a name`).toBeDefined();
        expect(p.type, `Element ${i} does not have a type`).toBeDefined();
        i++;
    });

});