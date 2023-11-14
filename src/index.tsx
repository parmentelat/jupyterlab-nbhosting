// still missing from the notebook classic version
// * enable_move_up_down
//   -> dropping this, no need as we can use the mouse to drag cells
// * show_metadata_in_header -> should go in courselevels
//   -> dropping this
// * inactivate_non_code_cells
//   -> xxx might be worth revisiting
// * redefine_enter_in_command_mode
//   -> xxx might be worth revisiting
//
/// dropping copy-to-clipboard
// https://github.com/parmentelat/jupyterlab-nbhosting/issues/1
// I am dismantling former copy-to-clipboard feature

import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application'

import { ICommandPalette, showDialog } from '@jupyterlab/apputils'

import { ISettingRegistry } from '@jupyterlab/settingregistry'

import { CommandRegistry } from '@lumino/commands'

import React from 'react'

//
//  Initialization data for the jupyterlab-nbhosting extension.
//
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-nbhosting:plugin',
  description: 'Custom look and feel for nbhosting notebooks',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ISettingRegistry],
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    settingRegistry: ISettingRegistry | null,
  ) => {
    if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then(settings => {
          console.log(
            'jupyterlab-nbhosting settings loaded:',
            settings.composite,
          )
        })
        .catch(reason => {
          console.error(
            'Failed to load settings for jupyterlab-nbhosting.',
            reason,
          )
        })
    }

    ////// helpers
    const get_url_param = (name: string) => {
      // get a URL parameter. I cannot believe we actually need this.
      // Based on http://stackoverflow.com/a/25359264/938949
      const match = new RegExp('[?&]' + name + '=([^&]*)').exec(
        window.location.search,
      )
      if (match) {
        return decodeURIComponent(match[1] || '')
      }
    }

    const course = get_url_param('course')
    const student = get_url_param('student')
    // window.location.pathname looks like this
    // "/35162/notebooks/w1/w1-s3-c4-fibonacci-prompt.ipynb"
    const regexp = new RegExp('^/([0-9]+)/notebooks/(.*)')
    // groups 1 and 2 refer to port and notebook respectively
    const map = { port: 1, notebook: 2 }
    const match = regexp.exec(window.location.pathname)
    const notebook = match ? match[map.notebook] : undefined

    const not_under_nbhosting = () => {
      showDialog({
        title: 'Available under nbhosting only',
        body: "You don't appear to be running inside nbhosting, sorry",
        buttons: [
          {
            label: 'Ok',
            caption: 'Ok',
            iconLabel: 'Ok',
            accept: true,
            className: 'nbh-dialog-button',
            ariaLabel: 'aria-label',
            iconClass: 'icon-class',
            actions: [],
            displayType: 'default',
          },
        ],
        defaultButton: 0,
      })
    }

    const reset_to_original = (arg: any) => {
      if (!notebook) {
        not_under_nbhosting()
        return
      }
      showDialog({
        title: 'Confirm reset to original',
        body: (
          <span>
            are you sure to reset your notebook to the original version ?
            <br />
            all your changes will be lost...
          </span>
        ),
        buttons: [
          // why on earth are all those settings here for ?
          {
            label: 'Reset',
            caption: 'Reset',
            iconLabel: 'Reset',
            accept: true,
            className: 'nbh-dialog-button',
            ariaLabel: 'aria-label',
            iconClass: 'icon-class',
            actions: [],
            displayType: 'default',
          },
          {
            label: 'Cancel',
            caption: 'Cancel',
            iconLabel: 'Cancel',
            accept: false,
            className: 'nbh-dialog-button',
            ariaLabel: 'aria-label',
            iconClass: 'icon-class',
            actions: [],
            displayType: 'default',
          },
        ],
        defaultButton: 0,
      }).then(answer => {
        if (answer.button.accept) {
          if (!notebook) {
            console.log('not under nbhosting')
            return
          }
          const reset_url = `/notebookLazyCopy/${course}/${notebook}/${student}?forcecopy=true`
          console.log('resetting -> ', reset_url)
          window.location.href = reset_url
        }
      })
    }

    const share_static_version = async (arg: any) => {
      if (!notebook) {
        not_under_nbhosting()
        return
      }
      const share_url = `/ipythonShare/${course}/${notebook}/${student}`
      try {
        const response = await fetch(share_url)
        const jsonData = await response.json()
        let message: string | JSX.Element
        if ('error' in jsonData) {
          message = `Could not create snapshot\n${jsonData.error}`
        } else {
          message = (
            <div className="nbh-dialog">
              <p className="nbh-larger">
                To share a static version of your notebook, copy this link:
                <a id="try-share-url" target="_blank" href={jsonData.url_path}>
                  Try the link
                </a>
              </p>
              <span id="share-url">{jsonData.url_path}</span>
              <p className="nbh-larger">
                Note that sharing the same notebook several times overwrites the
                same snapshot
              </p>
            </div>
          )
        }
        //
        showDialog({
          title: 'Static version created (or overwritten)',
          body: message,
          buttons: [
            // why on earth are all those settings here for ?
            {
              label: 'Ok',
              caption: 'Ok',
              iconLabel: 'Ok',
              accept: false,
              className: 'nbh-dialog-button',
              ariaLabel: 'aria-label',
              iconClass: 'icon-class',
              actions: [],
              displayType: 'default',
            },
          ],
          defaultButton: 0,
        }).then(answer => {
          console.log(`URL for shared static version is ${jsonData.url_path}`)
        })
      } catch (error) {
        console.log(`Error when using URL ${share_url}`)
        return
      }
    }

    const show_student_id = (arg: any) => {
      if (!notebook) {
        not_under_nbhosting()
        return
      }
      showDialog({
        title: 'Your student id',
        body: (
          <div className="nbh-dialog">
            <p className="nbh-larger">please copy and paste your id</p>
            <div id="student-id">{student}</div>
            <p>when you report an issue with the platform</p>
          </div>
        ),
        buttons: [
          {
            label: 'Ok',
            caption: 'Ok',
            iconLabel: 'Ok',
            accept: false,
            className: 'nbh-dialog-button',
            ariaLabel: 'aria-label',
            iconClass: 'icon-class',
            actions: [],
            displayType: 'default',
          },
        ],
        defaultButton: 0,
      }).then(answer => {
        if (student === undefined) {
          console.log('undefined student')
          return
        }
        console.log(`student id is ${student}`)
      })
    }
    //////// create commands

    const { commands } = app

    let command: string
    const category = 'nbhosting'

    command = 'nbhosting:reset-to-original'
    commands.addCommand(command, {
      label: 'Reset to Original',
      // caption: 'captions of reset-to-original',
      execute: reset_to_original,
    })
    palette.addItem({ command, category })

    command = 'nbhosting:share-static-version'
    commands.addCommand(command, {
      label: 'Share Static Version',
      // caption: 'captions of share-static-version',
      execute: share_static_version,
    })
    palette.addItem({ command, category })

    command = 'nbhosting:show-student-id'
    commands.addCommand(command, {
      label: 'Show Student id',
      // caption: 'captions of show-student-id',
      execute: show_student_id,
    })
    palette.addItem({ command, category })

    // to invoke a command
    // we may need to wait for the command to be registered
    // under notebook this function is called toggle-top
    const command_to_run = 'application:toggle-top'
    if (app.commands.hasCommand(command_to_run)) {
      app.commands.execute(command_to_run)
    } else {
      console.log(`waiting for the ${command_to_run} command to register`, app)
      const callback = (
        commands: CommandRegistry,
        changes: CommandRegistry.ICommandChangedArgs,
      ) => {
        if (changes.type === 'added' && changes.id === command_to_run) {
          app.commands.execute(command_to_run)
          commands.commandChanged.disconnect(callback)
        }
      }
      app.commands.commandChanged.connect(callback)
    }

    // shorter autosave interval
    if (settingRegistry) {
      console.log(
        'jupyterlab-nbhosting is setting autosaveInterval to 5 seconds',
      )
      settingRegistry
        .load('@jupyterlab/docmanager-extension:plugin')
        .then((nbSettings: ISettingRegistry.ISettings) =>
          nbSettings.set('autosaveInterval', 5),
        )
        .catch((err: Error) => {
          console.error(
            `jupyterlab-nbhosting: Could not set autosaveInterval : ${err}`,
          )
        })
    }

    console.log('JupyterLab extension jupyterlab-nbhosting has activated!')
  },
}

export default plugin
