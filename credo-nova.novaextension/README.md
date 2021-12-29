# Credo-Nova

Credo-Nova automatically lints all open elixir files, then reports errors and warnings in Nova's **Issues** sidebar and the editor gutter.

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
