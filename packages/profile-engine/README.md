# @buscadis/profile-engine

Motor de perfiles reutilizable para **Buscadis** (negocios) y **Conectadis** (personas).

## Contrato de adapter

Cada producto implementa un adapter que mapea su modelo de datos a `ProfileEntity`:

```ts
import type { ProfileEntity } from '@buscadis/profile-engine';

export function toProfileEntity(source: YourModel): ProfileEntity {
  return {
    kind: 'business', // o 'person'
    id: source.id,
    handle: source.slug,
    displayName: source.name,
    // ...
  };
}
```

## Capas

1. **Structure templates** — layout wireframe sin color (`social_wireframe_v1`, etc.)
2. **Style skins** — paleta y tipografía aplicables sobre cualquier estructura
3. **Component slots** — cada bloque es opcional, reordenable y con overrides de estilo

## Uso

```ts
import {
  resolveProfilePresentation,
  buildDefaultLayout,
  mergeProfileLayout,
} from '@buscadis/profile-engine';

const presentation = resolveProfilePresentation(entity, profileLayout, profileStyle, bannerConfig);
```

La UI React vive en la app consumidora (`components/profile/`) e importa tipos y resolvers de este paquete.
