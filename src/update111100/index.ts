import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import * as chalk from 'chalk';
import { updateDependency } from '../utility/dependencies';
import { finish, messageInfoRule, messageSuccessRule, updateI18nFile } from '../utility/util';

export function update111100(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    return chain([
      messageInfoRule(`Die LUX-Components werden auf die Version 11.11.0 aktualisiert...`),

      messageInfoRule(`Die Datei "package.json" wird angepasst...`),
      updateDependencies(),
      messageSuccessRule(`Die Datei "package.json" wurde angepasst.`),

      messageInfoRule(`Die Sprachdateien werden um Einträge für die neue File-Upload-Komponente ergänzt...`),
      updateI18N(),
      messageSuccessRule(`Die Sprachdateien wurden um Einträge für die neue File-Upload-Komponente ergänzt.`),

      messageSuccessRule(`Die LUX-Components wurden auf die Version 11.11.0 aktualisiert.`),
      finish(`${chalk.yellowBright('Fertig!')}`)
    ]);
  };

  function updateDependencies() {
    return (tree: Tree, _context: SchematicContext) => {
      updateDependency(tree, '@ihk-gfi/lux-components', '11.11.0');
      updateDependency(tree, '@ihk-gfi/lux-components-theme', '11.12.0');

      return tree;
    };
  }
}

function updateI18N() {
  return (tree: Tree, _context: SchematicContext) => {
    addI18nForNewFileUplaodComponent(tree);

    return tree;
  };
}

function addI18nForNewFileUplaodComponent(tree: Tree) {
  updateI18nFile(
    tree,
    'de',
    'luxc.menu.trigger.btn',
    `     
      <trans-unit id="luxc.file.upload.label" datatype="html">
        <source>Zum Hochladen Datei hier ablegen oder </source>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/demo/components-overview/file-example/file-upload-example/file-upload-example.component.ts</context>
          <context context-type="linenumber">24</context>
        </context-group>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-upload/lux-file-upload.component.ts</context>
          <context context-type="linenumber">44</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.upload.label.link" datatype="html">
        <source>Datei durchsuchen</source>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/demo/components-overview/file-example/file-upload-example/file-upload-example.component.ts</context>
          <context context-type="linenumber">25</context>
        </context-group>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-upload/lux-file-upload.component.ts</context>
          <context context-type="linenumber">45</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.upload.label.link.short" datatype="html">
        <source>Datei hochladen</source>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/demo/components-overview/file-example/file-upload-example/file-upload-example.component.ts</context>
          <context context-type="linenumber">26</context>
        </context-group>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-upload/lux-file-upload.component.ts</context>
          <context context-type="linenumber">46</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.upload.dialog.close.btn.arialabel" datatype="html">
        <source>Schließen</source>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-subcomponents/lux-file-delete-dialog/lux-file-delete-dialog.component.html</context>
          <context context-type="linenumber">5</context>
        </context-group>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-subcomponents/lux-file-replace-dialog/lux-file-replace-dialog.component.html</context>
          <context context-type="linenumber">5</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.delete.dialog.title" datatype="html">
        <source> Wollen Sie die Datei wirklich löschen? </source>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-subcomponents/lux-file-delete-dialog/lux-file-delete-dialog.component.html</context>
          <context context-type="linenumber">14,15</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.delete.dialog.content" datatype="html">
        <source> Wenn Sie die Datei löschen, wird diese unwiderruflich gelöscht. </source>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-subcomponents/lux-file-delete-dialog/lux-file-delete-dialog.component.html</context>
          <context context-type="linenumber">19,20</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.delete.dialog.cancel.lbl" datatype="html">
        <source>Abbrechen</source>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-subcomponents/lux-file-delete-dialog/lux-file-delete-dialog.component.html</context>
          <context context-type="linenumber">24</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.delete.dialog.delete.lbl" datatype="html">
        <source>Löschen</source>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-subcomponents/lux-file-delete-dialog/lux-file-delete-dialog.component.html</context>
          <context context-type="linenumber">30</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.replace.dialog.title.multiple" datatype="html">
        <source> Wollen Sie fortfahren und die Dateien mit gleichen Namen ersetzen? </source>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-subcomponents/lux-file-replace-dialog/lux-file-replace-dialog.component.html</context>
          <context context-type="linenumber">18,19</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.replace.dialog.title" datatype="html">
        <source> Wollen Sie fortfahren und die Datei ersetzen? </source>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-subcomponents/lux-file-replace-dialog/lux-file-replace-dialog.component.html</context>
          <context context-type="linenumber">25,26</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.replace.dialog.content.multiple" datatype="html">
        <source> Wenn Sie Dateien mit gleichen Namen hochladen, werden diese ersetzt. </source>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-subcomponents/lux-file-replace-dialog/lux-file-replace-dialog.component.html</context>
          <context context-type="linenumber">34,35</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.replace.dialog.content" datatype="html">
        <source> Wenn Sie eine neue Datei auswählen, wird die vorhandene Datei ersetzt. </source>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-subcomponents/lux-file-replace-dialog/lux-file-replace-dialog.component.html</context>
          <context context-type="linenumber">41,42</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.replace.dialog.cancel.lbl" datatype="html">
        <source>Abbrechen</source>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-subcomponents/lux-file-replace-dialog/lux-file-replace-dialog.component.html</context>
          <context context-type="linenumber">46</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.replace.dialog.replace.lbl" datatype="html">
        <source>Ersetzen</source>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-subcomponents/lux-file-replace-dialog/lux-file-replace-dialog.component.html</context>
          <context context-type="linenumber">52</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.upload.delete.btn.arialabel" datatype="html">
        <source>Button zum Löschen der Datei <x id="INTERPOLATION" equiv-text="{{ file.name }}"/></source>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-upload/lux-file-upload.component.html</context>
          <context context-type="linenumber">84</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.upload.error_message.max_file_size" datatype="html">
        <source>Die Datei &quot;<x id="PH" equiv-text="file.name"/>&quot; überschreitet die maximal zulässige Dateigröße von <x id="PH_1" equiv-text="this.luxMaxSizeMB"/> Megabytes.</source>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-upload/lux-file-upload.component.ts</context>
          <context context-type="linenumber">321</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.upload.error_message.not_accepted" datatype="html">
        <source>Die Datei &quot;<x id="PH" equiv-text="file.name"/>&quot; entspricht keinem akzeptierten Dateityp. Es sind nur Dateien vom Typ <x id="PH_1" equiv-text="LuxUtil.getAcceptTypesAsMessagePart(this.luxAccept)"/> erlaubt.</source>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-upload/lux-file-upload.component.ts</context>
          <context context-type="linenumber">325,327</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.upload.error_message.only_one_file" datatype="html">
        <source>Es darf nur eine Datei hochgeladen werden.</source>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-upload/lux-file-upload.component.ts</context>
          <context context-type="linenumber">331</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.upload.error_message.read_error" datatype="html">
        <source>Beim Hochladen der ausgewählten Datei ist ein Fehler aufgetreten. Bitte versuchen Sie es noch einmal.</source>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-upload/lux-file-upload.component.ts</context>
          <context context-type="linenumber">335</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.upload.error_message.upload_error" datatype="html">
        <source>Beim Hochladen der ausgewählten Datei ist ein Fehler aufgetreten. Bitte versuchen Sie es noch einmal.</source>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-upload/lux-file-upload.component.ts</context>
          <context context-type="linenumber">339</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.upload.file.type.concat" datatype="html">
        <source> oder </source>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-util/lux-util.ts</context>
          <context context-type="linenumber">416</context>
        </context-group>
      </trans-unit>
        `
  );

  updateI18nFile(
    tree,
    'en',
    'luxc.menu.trigger.btn',
    `     
      <trans-unit id="luxc.file.upload.label" datatype="html">
        <source>Zum Hochladen Datei hier ablegen oder </source>
        <target>Drop file here or </target>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/demo/components-overview/file-example/file-upload-example/file-upload-example.component.ts</context>
          <context context-type="linenumber">24</context>
        </context-group>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-upload/lux-file-upload.component.ts</context>
          <context context-type="linenumber">44</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.upload.label.link" datatype="html">
        <source>Datei durchsuchen</source>
        <target>browse file</target>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/demo/components-overview/file-example/file-upload-example/file-upload-example.component.ts</context>
          <context context-type="linenumber">25</context>
        </context-group>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-upload/lux-file-upload.component.ts</context>
          <context context-type="linenumber">45</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.upload.label.link.short" datatype="html">
        <source>Datei hochladen</source>
        <target>Upload file</target>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/demo/components-overview/file-example/file-upload-example/file-upload-example.component.ts</context>
          <context context-type="linenumber">26</context>
        </context-group>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-upload/lux-file-upload.component.ts</context>
          <context context-type="linenumber">46</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.upload.dialog.close.btn.arialabel" datatype="html">
        <source>Schließen</source>
        <target>Close</target>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-subcomponents/lux-file-delete-dialog/lux-file-delete-dialog.component.html</context>
          <context context-type="linenumber">5</context>
        </context-group>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-subcomponents/lux-file-replace-dialog/lux-file-replace-dialog.component.html</context>
          <context context-type="linenumber">5</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.delete.dialog.title" datatype="html">
        <source> Wollen Sie die Datei wirklich löschen? </source>
        <target>Do you really want to delete the file?</target>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-subcomponents/lux-file-delete-dialog/lux-file-delete-dialog.component.html</context>
          <context context-type="linenumber">14,15</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.delete.dialog.content" datatype="html">
        <source> Wenn Sie die Datei löschen, wird diese unwiderruflich gelöscht. </source>
        <target>If you delete the file, it will be irretrievably deleted.</target>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-subcomponents/lux-file-delete-dialog/lux-file-delete-dialog.component.html</context>
          <context context-type="linenumber">19,20</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.delete.dialog.cancel.lbl" datatype="html">
        <source>Abbrechen</source>
        <target>Cancel</target>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-subcomponents/lux-file-delete-dialog/lux-file-delete-dialog.component.html</context>
          <context context-type="linenumber">24</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.delete.dialog.delete.lbl" datatype="html">
        <source>Löschen</source>
        <target>Delete</target>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-subcomponents/lux-file-delete-dialog/lux-file-delete-dialog.component.html</context>
          <context context-type="linenumber">30</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.replace.dialog.title.multiple" datatype="html">
        <source> Wollen Sie fortfahren und die Dateien mit gleichen Namen ersetzen? </source>
        <target>Do you want to continue and replace the files with the same names?</target>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-subcomponents/lux-file-replace-dialog/lux-file-replace-dialog.component.html</context>
          <context context-type="linenumber">18,19</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.replace.dialog.title" datatype="html">
        <source> Wollen Sie fortfahren und die Datei ersetzen? </source>
        <target>Do you want to continue and replace the file?</target>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-subcomponents/lux-file-replace-dialog/lux-file-replace-dialog.component.html</context>
          <context context-type="linenumber">25,26</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.replace.dialog.content.multiple" datatype="html">
        <source> Wenn Sie Dateien mit gleichen Namen hochladen, werden diese ersetzt. </source>
        <target>If you upload files with the same name, they will be replaced.</target>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-subcomponents/lux-file-replace-dialog/lux-file-replace-dialog.component.html</context>
          <context context-type="linenumber">34,35</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.replace.dialog.content" datatype="html">
        <source> Wenn Sie eine neue Datei auswählen, wird die vorhandene Datei ersetzt. </source>
        <target>If you select a new file, the existing file will be replaced.</target>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-subcomponents/lux-file-replace-dialog/lux-file-replace-dialog.component.html</context>
          <context context-type="linenumber">41,42</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.replace.dialog.cancel.lbl" datatype="html">
        <source>Abbrechen</source>
        <target>Cancel</target>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-subcomponents/lux-file-replace-dialog/lux-file-replace-dialog.component.html</context>
          <context context-type="linenumber">46</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.replace.dialog.replace.lbl" datatype="html">
        <source>Ersetzen</source>
        <target>Replace</target>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-subcomponents/lux-file-replace-dialog/lux-file-replace-dialog.component.html</context>
          <context context-type="linenumber">52</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.upload.delete.btn.arialabel" datatype="html">
        <source>Button zum Löschen der Datei <x id="INTERPOLATION" equiv-text="{{ file.name }}"/></source>
        <target>Button to delete the file <x id="INTERPOLATION" equiv-text="{{ file.name }}"/></target>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-upload/lux-file-upload.component.html</context>
          <context context-type="linenumber">84</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.upload.error_message.max_file_size" datatype="html">
        <source>Die Datei &quot;<x id="PH" equiv-text="file.name"/>&quot; überschreitet die maximal zulässige Dateigröße von <x id="PH_1" equiv-text="this.luxMaxSizeMB"/> Megabytes.</source>
        <target>The file &quot;<x id="PH" equiv-text="file.name"/>&quot; exceeds the maximum file size of <x id="PH_1" equiv-text="this.luxMaxSizeMB"/> megabytes.</target>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-upload/lux-file-upload.component.ts</context>
          <context context-type="linenumber">321</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.upload.error_message.not_accepted" datatype="html">
        <source>Die Datei &quot;<x id="PH" equiv-text="file.name"/>&quot; entspricht keinem akzeptierten Dateityp. Es sind nur Dateien vom Typ <x id="PH_1" equiv-text="LuxUtil.getAcceptTypesAsMessagePart(this.luxAccept)"/> erlaubt.</source>
        <target>The file &quot;<x id="PH" equiv-text="file.name"/>&quot;  does not match an accepted file type. Only <x id="PH_1" equiv-text="LuxUtil.getAcceptTypesAsMessagePart(this.luxAccept)"/> files are allowed.</target>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-upload/lux-file-upload.component.ts</context>
          <context context-type="linenumber">325,327</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.upload.error_message.only_one_file" datatype="html">
        <source>Es darf nur eine Datei hochgeladen werden.</source>
        <target>Only one file may be uploaded.</target>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-upload/lux-file-upload.component.ts</context>
          <context context-type="linenumber">331</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.upload.error_message.read_error" datatype="html">
        <source>Beim Hochladen der ausgewählten Datei ist ein Fehler aufgetreten. Bitte versuchen Sie es noch einmal.</source>
        <target>An error occurred while uploading the selected file. Please try again.</target>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-upload/lux-file-upload.component.ts</context>
          <context context-type="linenumber">335</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.upload.error_message.upload_error" datatype="html">
        <source>Beim Hochladen der ausgewählten Datei ist ein Fehler aufgetreten. Bitte versuchen Sie es noch einmal.</source>
        <target>An error occurred while uploading the selected file. Please try again.</target>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-form/lux-file/lux-file-upload/lux-file-upload.component.ts</context>
          <context context-type="linenumber">339</context>
        </context-group>
      </trans-unit>
      <trans-unit id="luxc.file.upload.file.type.concat" datatype="html">
        <source> or </source>
        <context-group purpose="location">
          <context context-type="sourcefile">src/app/modules/lux-util/lux-util.ts</context>
          <context context-type="linenumber">416</context>
        </context-group>
      </trans-unit>
        `
  );
}

