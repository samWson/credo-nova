<!--
👋 Hello! As Nova users browse the extensions library, a good README can help them understand what your extension does, how it works, and what setup or configuration it may require.

Not every extension will need every item described below. Use your best judgement when deciding which parts to keep to provide the best experience for your new users.

💡 Quick Tip! As you edit this README template, you can preview your changes by selecting **Extensions → Activate Project as Extension**, opening the Extension Library, and selecting "credo-nova" in the sidebar.

Let's get started!
-->

<!--
🎈 Include a brief description of the features your extension provides. For example:
-->

**credo-nova** automatically lints all open files, then reports errors and warnings in Nova's **Issues** sidebar and the editor gutter:

<!--
🎈 It can also be helpful to include a screenshot or GIF showing your extension in action:
-->

![](https://nova.app/images/en/dark/editor.png)

## Requirements

credo-nova requires [Credo](https://hexdocs.pm/credo/installation.html) to be added as a `mix` dependancy.

Add `:credo` as a dependancy to your project's `mix.exs`:

```elixir
defp deps do
  [
	{:credo, "~> 1.6", only: [:dev, :test], runtime: false}
  ]
end
```

And run:

```shell
$ mix deps.get
```

## License

This repository is open source software released under the terms of the [BSD license (BSD-3-Clause)](https://opensource.org/licenses/BSD-3-Clause). See the LICENSE file for details.

## Acknowledgments

[SeriouslyAwesome](https://github.com/SeriouslyAwesome) whose Nova extension I referenced heavily when writing this extension, [rubocop-nova](https://github.com/SeriouslyAwesome/rubocop-nova).
