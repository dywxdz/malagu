import { Component, Autowired, Optional, getOwnMetadata } from '@malagu/core';
import {
    SecurityMetadataSource, SecurityMetadata, MethodSecurityMetadataContext,
    SecurityExpressionContextHandler, SECURITY_EXPRESSION_CONTEXT_KEY, PolicyType
} from './access-protocol';
import { SecurityContext } from '../context';
import { METADATA_KEY } from '../constants';
import { AuthorizeMetadata } from '../annotation/authorize';
import { Context } from '@malagu/web/lib/node';

@Component(SecurityMetadataSource)
export class MethodSecurityMetadataSource implements SecurityMetadataSource {

    @Autowired(SecurityExpressionContextHandler) @Optional
    protected readonly securityExpressionContextHandler: SecurityExpressionContextHandler;

    async load(context: MethodSecurityMetadataContext): Promise<SecurityMetadata> {
        const classMetadatas: AuthorizeMetadata[] = getOwnMetadata(METADATA_KEY.authorize, context.target.constructor);
        const methodMetadatas: AuthorizeMetadata[] = getOwnMetadata(METADATA_KEY.authorize, context.target.constructor, context.method);
        const ctx = {
            ...context,
            ...SecurityContext.getAuthentication()
        };
        Context.setAttr(SECURITY_EXPRESSION_CONTEXT_KEY, ctx);
        if (this.securityExpressionContextHandler) {
            await this.securityExpressionContextHandler.handle(ctx);
        }
        const policies = classMetadatas.concat(...methodMetadatas)
            .filter(item => item.authorizeType === context.authorizeType)
            .map(item => ({
                type: PolicyType.El,
                authorizeType: item.authorizeType,
                el: item.el
            }));

        const resource = context.target.name;
        return {
            authorizeType: context.authorizeType,
            principal: SecurityContext.getAuthentication().principal,
            action: context.method,
            resource,
            policies: policies
        };
    }
}
