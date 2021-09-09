
import { TextDocument, CancellationToken, DocumentColorProvider, Color, ColorPresentation, Range, ColorInformation } from "vscode";

export class CaptionColorsProvider implements DocumentColorProvider {
    head = "<clr:";
    tail = ">";
    provideDocumentColors(document: TextDocument, cancellationToken: CancellationToken) : ColorInformation[] {
        const lines = document.lineCount;

        const colorInfos = [];
        // TODO: Implement <playerclr>
        for(let i = 0; i < lines; i++) {
            if(cancellationToken.isCancellationRequested) break;
            
            // Get a line that isn't empty
            const line = document.lineAt(i);
            if(line.isEmptyOrWhitespace) continue;
            const lineText = line.text;

            // Check if it start with the color tag
            const beginIndex = lineText.indexOf(this.head);
            if(beginIndex === -1) continue;
            
            // Check if it ends with the color tag
            const rest = lineText.slice(beginIndex);
            const endIndex = rest.indexOf(this.tail);
            if(endIndex === -1) continue;

            // Extract the values of the color tag
            const colorString = rest.substring(this.head.length, endIndex);
            const rgbString = colorString.split(",");
            if(rgbString.length != 3) continue;
            
            // Validate array
            const rgb = rgbString.map(item => parseInt(item));
            if(rgb.some(num => num < 0 || num > 255)) continue;

            // Get the position and color information
            const posStart = beginIndex + this.head.length;
            const posEnd = endIndex + beginIndex;
            //output.appendLine(`${posStart}-${posEnd} => '${lineText.substring(posStart, posEnd)}'`);

            // We got a color!
            const color = new Color(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, 1.0);
            const range = new Range(i, posStart, i, posEnd);
            const colorInfo = new ColorInformation(range, color);
            colorInfos.push(colorInfo);
        }

        return colorInfos;
    }

    provideColorPresentations(color: Color, context: {document: TextDocument, range: Range}, cancellationToken: CancellationToken) : ColorPresentation[] {
        return [];
    }
}